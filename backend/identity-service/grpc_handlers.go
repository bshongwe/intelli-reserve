package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	pb "github.com/intelli-reserve/backend/gen/go/identity"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// IdentityServiceServer implements the IdentityService gRPC service
type IdentityServiceServer struct {
	pb.UnimplementedIdentityServiceServer
	db        *pgx.Conn
	jwtSecret []byte
}

// NewIdentityServiceServer creates a new IdentityServiceServer
func NewIdentityServiceServer(db *pgx.Conn) *IdentityServiceServer {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}
	return &IdentityServiceServer{db: db, jwtSecret: []byte(secret)}
}

func (s *IdentityServiceServer) signToken(userID, email, userType string) (string, error) {
	claims := jwt.MapClaims{
		"sub":      userID,
		"email":    email,
		"userType": userType,
		"exp":      time.Now().UTC().Add(time.Hour).Unix(),
		"iat":      time.Now().UTC().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}

// Register creates a new user account
func (s *IdentityServiceServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.AuthResponse, error) {
	// Validate required fields
	if req.Email == "" || req.Password == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: email, password",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("👤 Register request for email: %s", req.Email)

	userID := uuid.New().String()
	now := time.Now().UTC()

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Password hashing error: %v", err)
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to register user: %v", err),
		}, status.Error(codes.Internal, "password hashing failed")
	}

	// Insert user into database
	query := `
		INSERT INTO users (id, email, password_hash, full_name, business_name, phone, user_type, email_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, '', $6, false, $7, $8)
		RETURNING id, email, full_name, user_type, created_at, updated_at
	`

	var returnedID, returnedEmail, returnedFullName, returnedUserType, createdAt, updatedAt string
	businessName := req.FullName
	if req.UserType == "client" {
		businessName = "Personal"
	}
	err = s.db.QueryRow(ctx, query,
		userID, req.Email, string(hashedPassword), req.FullName, businessName, req.UserType, now, now,
	).Scan(&returnedID, &returnedEmail, &returnedFullName, &returnedUserType, &createdAt, &updatedAt)

	if err != nil {
		log.Printf("❌ Database error: %v", err)
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to register user: %v", err),
		}, status.Error(codes.Internal, "failed to register user")
	}

	log.Printf("✅ User registered: %s", userID)

	accessToken, err := s.signToken(returnedID, returnedEmail, returnedUserType)
	if err != nil {
		log.Printf("❌ Token signing error: %v", err)
		return &pb.AuthResponse{Success: false, ErrorMessage: "Failed to sign token"}, status.Error(codes.Internal, "token signing failed")
	}

	return &pb.AuthResponse{
		Success:     true,
		UserId:      returnedID,
		Email:       returnedEmail,
		FullName:    returnedFullName,
		UserType:    returnedUserType,
		AccessToken: accessToken,
		ExpiresIn:   3600,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}, nil
}

// Login authenticates a user
func (s *IdentityServiceServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.AuthResponse, error) {
	// Validate required fields
	if req.Email == "" || req.Password == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: email, password",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("🔐 Login attempt for email: %s", req.Email)

	// Query user from database
	query := `
		SELECT id, email, password_hash, full_name, user_type, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var userID, email, passwordHash, fullName, userType, createdAt, updatedAt string
	err := s.db.QueryRow(ctx, query, req.Email).Scan(&userID, &email, &passwordHash, &fullName, &userType, &createdAt, &updatedAt)

	if err != nil {
		log.Printf("❌ User not found: %v", err)
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "Invalid email or password",
		}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		log.Printf("❌ Password verification failed")
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "Invalid email or password",
		}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	// Update last login
	updateQuery := `UPDATE users SET last_login_at = $1 WHERE id = $2`
	now := time.Now().UTC()
	_, err = s.db.Exec(ctx, updateQuery, now, userID)
	if err != nil {
		log.Printf("⚠️ Failed to update last login: %v", err)
	}

	log.Printf("✅ User logged in: %s", userID)

	accessToken, err := s.signToken(userID, email, userType)
	if err != nil {
		log.Printf("❌ Token signing error: %v", err)
		return &pb.AuthResponse{Success: false, ErrorMessage: "Failed to sign token"}, status.Error(codes.Internal, "token signing failed")
	}

	return &pb.AuthResponse{
		Success:     true,
		UserId:      userID,
		Email:       email,
		FullName:    fullName,
		UserType:    userType,
		AccessToken: accessToken,
		ExpiresIn:   3600,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}, nil
}

// RefreshToken refreshes an access token using a refresh token
func (s *IdentityServiceServer) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.AuthResponse, error) {
	if req.RefreshToken == "" || req.UserId == "" {
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "refresh_token and user_id are required",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("🔄 Refresh token request for user: %s", req.UserId)

	// Query user from database
	query := `SELECT id, email, full_name, user_type, created_at, updated_at FROM users WHERE id = $1`

	var userID, email, fullName, userType, createdAt, updatedAt string
	err := s.db.QueryRow(ctx, query, req.UserId).Scan(&userID, &email, &fullName, &userType, &createdAt, &updatedAt)

	if err != nil {
		log.Printf("❌ User not found: %v", err)
		return &pb.AuthResponse{
			Success:      false,
			ErrorMessage: "User not found",
		}, status.Error(codes.NotFound, "user not found")
	}

	log.Printf("✅ Token refreshed for user: %s", userID)

	accessToken, err := s.signToken(userID, email, userType)
	if err != nil {
		log.Printf("❌ Token signing error: %v", err)
		return &pb.AuthResponse{Success: false, ErrorMessage: "Failed to sign token"}, status.Error(codes.Internal, "token signing failed")
	}

	return &pb.AuthResponse{
		Success:     true,
		UserId:      userID,
		Email:       email,
		FullName:    fullName,
		UserType:    userType,
		AccessToken: accessToken,
		ExpiresIn:   3600,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}, nil
}

// ValidateToken validates an access token
func (s *IdentityServiceServer) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	if req.AccessToken == "" {
		return &pb.ValidateTokenResponse{
			Valid:        false,
			ErrorMessage: "access_token is required",
		}, status.Error(codes.InvalidArgument, "access_token required")
	}

	log.Printf("✔️ Validating token")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return &pb.ValidateTokenResponse{
			Valid:        false,
			ErrorMessage: "JWT_SECRET not configured",
		}, status.Error(codes.Internal, "JWT_SECRET not configured")
	}

	token, err := jwt.Parse(req.AccessToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		log.Printf("❌ Token validation failed: %v", err)
		return &pb.ValidateTokenResponse{
			Valid:        false,
			ErrorMessage: "Invalid or expired token",
		}, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return &pb.ValidateTokenResponse{
			Valid:        false,
			ErrorMessage: "Invalid token claims",
		}, nil
	}

	log.Printf("✅ Token valid for user: %v", claims["sub"])
	return &pb.ValidateTokenResponse{
		Valid:     true,
		UserId:    fmt.Sprintf("%v", claims["sub"]),
		Email:     fmt.Sprintf("%v", claims["email"]),
		UserType:  fmt.Sprintf("%v", claims["userType"]),
	}, nil
}

// RevokeToken revokes an access token
func (s *IdentityServiceServer) RevokeToken(ctx context.Context, req *pb.RevokeTokenRequest) (*pb.RevokeTokenResponse, error) {
	if req.UserId == "" || req.AccessToken == "" {
		return &pb.RevokeTokenResponse{
			Success:      false,
			ErrorMessage: "user_id and access_token are required",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("🔒 Revoking token for user: %s", req.UserId)

	// TODO: Add token to blacklist/revocation list
	return &pb.RevokeTokenResponse{
		Success: true,
	}, nil
}

// GetUser retrieves user information
func (s *IdentityServiceServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id required")
	}

	log.Printf("📋 GetUser for: %s", req.UserId)

	query := `
		SELECT id, email, full_name, user_type, COALESCE(phone, ''), COALESCE(bio, ''), COALESCE(profile_image_url, ''), COALESCE(email_verified, false), COALESCE(phone_verified, false), created_at, updated_at, COALESCE(TO_CHAR(last_login_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		FROM users
		WHERE id = $1
	`

	var user pb.User
	var phone, bio, profileImageURL, lastLoginAt string

	err := s.db.QueryRow(ctx, query, req.UserId).Scan(
		&user.Id, &user.Email, &user.FullName, &user.UserType, &phone, &bio, &profileImageURL,
		&user.EmailVerified, &user.PhoneVerified, &user.CreatedAt, &user.UpdatedAt, &lastLoginAt,
	)

	if err != nil {
		log.Printf("❌ User not found: %v", err)
		return nil, status.Error(codes.NotFound, "user not found")
	}

	user.Phone = phone
	user.Bio = bio
	user.ProfileImageUrl = profileImageURL
	user.LastLoginAt = lastLoginAt

	log.Printf("✅ User retrieved: %s", req.UserId)
	return &user, nil
}

// UpdateUser updates user information
func (s *IdentityServiceServer) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.User, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id required")
	}

	log.Printf("✏️ UpdateUser for: %s", req.UserId)

	now := time.Now().UTC()

	query := `
		UPDATE users
		SET full_name = $1, phone = $2, bio = $3, profile_image_url = $4, avatar_url = $4, updated_at = $5
		WHERE id = $6
		RETURNING id, email, full_name, user_type, COALESCE(phone, ''), COALESCE(bio, ''), COALESCE(profile_image_url, ''), COALESCE(email_verified, false), COALESCE(phone_verified, false), created_at, updated_at, COALESCE(TO_CHAR(last_login_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
	`

	var user pb.User
	var phone, bio, profileImageURL, lastLoginAt string

	err := s.db.QueryRow(ctx, query,
		req.FullName, req.Phone, req.Bio, req.ProfileImageUrl, now, req.UserId,
	).Scan(
		&user.Id, &user.Email, &user.FullName, &user.UserType, &phone, &bio, &profileImageURL,
		&user.EmailVerified, &user.PhoneVerified, &user.CreatedAt, &user.UpdatedAt, &lastLoginAt,
	)

	if err != nil {
		log.Printf("❌ Update error: %v", err)
		return nil, status.Error(codes.Internal, "failed to update user")
	}

	user.Phone = phone
	user.Bio = bio
	user.ProfileImageUrl = profileImageURL
	user.LastLoginAt = lastLoginAt

	log.Printf("✅ User updated: %s", req.UserId)
	return &user, nil
}

// ChangePassword changes user password
func (s *IdentityServiceServer) ChangePassword(ctx context.Context, req *pb.ChangePasswordRequest) (*pb.ChangePasswordResponse, error) {
	if req.UserId == "" || req.CurrentPassword == "" || req.NewPassword == "" {
		return &pb.ChangePasswordResponse{
			Success:      false,
			ErrorMessage: "Missing required fields",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("🔑 ChangePassword for user: %s", req.UserId)

	// Query current password hash
	query := `SELECT password_hash FROM users WHERE id = $1`
	var passwordHash string
	err := s.db.QueryRow(ctx, query, req.UserId).Scan(&passwordHash)

	if err != nil {
		log.Printf("❌ User not found: %v", err)
		return &pb.ChangePasswordResponse{
			Success:      false,
			ErrorMessage: "User not found",
		}, status.Error(codes.NotFound, "user not found")
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.CurrentPassword))
	if err != nil {
		log.Printf("❌ Current password verification failed")
		return &pb.ChangePasswordResponse{
			Success:      false,
			ErrorMessage: "Invalid current password",
		}, status.Error(codes.Unauthenticated, "invalid password")
	}

	// Hash new password
	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Password hashing error: %v", err)
		return &pb.ChangePasswordResponse{
			Success:      false,
			ErrorMessage: "Failed to change password",
		}, status.Error(codes.Internal, "password hashing failed")
	}

	// Update password
	updateQuery := `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().UTC()
	_, err = s.db.Exec(ctx, updateQuery, string(newHashedPassword), now, req.UserId)

	if err != nil {
		log.Printf("❌ Update error: %v", err)
		return &pb.ChangePasswordResponse{
			Success:      false,
			ErrorMessage: "Failed to change password",
		}, status.Error(codes.Internal, "failed to update password")
	}

	log.Printf("✅ Password changed for user: %s", req.UserId)
	return &pb.ChangePasswordResponse{
		Success: true,
	}, nil
}

// GetUserSessions retrieves all sessions for a user
func (s *IdentityServiceServer) GetUserSessions(ctx context.Context, req *pb.GetUserSessionsRequest) (*pb.GetUserSessionsResponse, error) {
	if req.UserId == "" {
		return &pb.GetUserSessionsResponse{
			Success:      false,
			ErrorMessage: "user_id is required",
		}, status.Error(codes.InvalidArgument, "user_id required")
	}

	log.Printf("📋 GetUserSessions for user: %s", req.UserId)

	query := `
		SELECT session_id, user_id, ip_address, user_agent, created_at, expires_at, last_activity_at
		FROM user_sessions
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY last_activity_at DESC
	`

	rows, err := s.db.Query(ctx, query, req.UserId)
	if err != nil {
		log.Printf("❌ Query error: %v", err)
		return &pb.GetUserSessionsResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Error: %v", err),
		}, status.Error(codes.Internal, "database error")
	}
	defer rows.Close()

	var sessions []*pb.Session
	for rows.Next() {
		var session pb.Session
		err := rows.Scan(&session.SessionId, &session.UserId, &session.IpAddress, &session.UserAgent, &session.CreatedAt, &session.ExpiresAt, &session.LastActivityAt)
		if err != nil {
			log.Printf("❌ Scan error: %v", err)
			continue
		}
		sessions = append(sessions, &session)
	}

	log.Printf("✅ Retrieved %d sessions for user: %s", len(sessions), req.UserId)
	return &pb.GetUserSessionsResponse{
		Success:  true,
		Sessions: sessions,
	}, nil
}

// RevokeSession revokes a specific session
func (s *IdentityServiceServer) RevokeSession(ctx context.Context, req *pb.RevokeSessionRequest) (*pb.RevokeSessionResponse, error) {
	if req.UserId == "" || req.SessionId == "" {
		return &pb.RevokeSessionResponse{
			Success:      false,
			ErrorMessage: "user_id and session_id are required",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("🔒 Revoking session %s for user: %s", req.SessionId, req.UserId)

	query := `DELETE FROM user_sessions WHERE session_id = $1 AND user_id = $2`
	result, err := s.db.Exec(ctx, query, req.SessionId, req.UserId)

	if err != nil {
		log.Printf("❌ Delete error: %v", err)
		return &pb.RevokeSessionResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to revoke session: %v", err),
		}, status.Error(codes.Internal, "failed to revoke session")
	}

	if result.RowsAffected() == 0 {
		log.Printf("⚠️ Session not found: %s", req.SessionId)
		return &pb.RevokeSessionResponse{
			Success:      false,
			ErrorMessage: "Session not found",
		}, status.Error(codes.NotFound, "session not found")
	}

	log.Printf("✅ Session revoked: %s", req.SessionId)
	return &pb.RevokeSessionResponse{
		Success: true,
	}, nil
}
