package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	pb "github.com/intelli-reserve/backend/gen/go/notification"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// NotificationServiceServer implements the NotificationService gRPC service
type NotificationServiceServer struct {
	pb.UnimplementedNotificationServiceServer
	db *pgx.Conn
}

// Helper function to format timestamps
func formatTimestamp(t time.Time) string {
	return t.Format(time.RFC3339)
}

// NewNotificationServiceServer creates a new NotificationServiceServer
func NewNotificationServiceServer(db *pgx.Conn) *NotificationServiceServer {
	return &NotificationServiceServer{db: db}
}

// SendBookingConfirmation sends a booking confirmation notification
func (s *NotificationServiceServer) SendBookingConfirmation(ctx context.Context, req *pb.SendBookingConfirmationRequest) (*pb.SendNotificationResponse, error) {
	// Validate required fields
	if req.BookingId == "" || req.ClientEmail == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: booking_id, client_email",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("📧 SendBookingConfirmation request received:")
	log.Printf("   Booking ID: %s", req.BookingId)
	log.Printf("   Client Email: %s", req.ClientEmail)

	notificationID := uuid.New().String()
	now := time.Now().UTC()

	// Insert notification into database
	query := `
		INSERT INTO notifications (id, recipient_email, notification_type, subject, body, channel, status, booking_id, host_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	subject := fmt.Sprintf("Booking Confirmation - %s", req.ServiceName)
	body := fmt.Sprintf("Your booking for %s on %s at %s has been confirmed.", req.ServiceName, req.SlotDate, req.StartTime)

	var returnedID string
	err := s.db.QueryRow(ctx, query,
		notificationID, req.ClientEmail, "booking_confirmation", subject, body, "email", "pending",
		req.BookingId, req.HostId, now, now,
	).Scan(&returnedID)

	if err != nil {
		log.Printf("❌ Database error creating notification: %v", err)
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to send notification: %v", err),
		}, status.Error(codes.Internal, "failed to send notification")
	}

	log.Printf("✅ Notification sent successfully: %s", notificationID)

	return &pb.SendNotificationResponse{
		Success:        true,
		NotificationId: notificationID,
	}, nil
}

// SendBookingCancellation sends a booking cancellation notification
func (s *NotificationServiceServer) SendBookingCancellation(ctx context.Context, req *pb.SendBookingCancellationRequest) (*pb.SendNotificationResponse, error) {
	// Validate required fields
	if req.BookingId == "" || req.ClientEmail == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: booking_id, client_email",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("📧 SendBookingCancellation request received:")
	log.Printf("   Booking ID: %s", req.BookingId)
	log.Printf("   Client Email: %s", req.ClientEmail)

	notificationID := uuid.New().String()
	now := time.Now().UTC()

	// Insert notification into database
	query := `
		INSERT INTO notifications (id, recipient_email, notification_type, subject, body, channel, status, booking_id, host_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	subject := fmt.Sprintf("Booking Cancelled - %s", req.ServiceName)
	body := fmt.Sprintf("Your booking for %s has been cancelled. Reason: %s", req.ServiceName, req.Reason)

	var returnedID string
	err := s.db.QueryRow(ctx, query,
		notificationID, req.ClientEmail, "booking_cancellation", subject, body, "email", "pending",
		req.BookingId, req.HostId, now, now,
	).Scan(&returnedID)

	if err != nil {
		log.Printf("❌ Database error: %v", err)
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to send notification: %v", err),
		}, status.Error(codes.Internal, "failed to send notification")
	}

	log.Printf("✅ Cancellation notification sent: %s", notificationID)

	return &pb.SendNotificationResponse{
		Success:        true,
		NotificationId: notificationID,
	}, nil
}

// SendReminderNotification sends a booking reminder notification
func (s *NotificationServiceServer) SendReminderNotification(ctx context.Context, req *pb.SendReminderRequest) (*pb.SendNotificationResponse, error) {
	// Validate required fields
	if req.BookingId == "" || req.ClientEmail == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: booking_id, client_email",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("📧 SendReminderNotification request received:")
	log.Printf("   Booking ID: %s", req.BookingId)

	notificationID := uuid.New().String()
	now := time.Now().UTC()

	query := `
		INSERT INTO notifications (id, recipient_email, notification_type, subject, body, channel, status, booking_id, host_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	subject := fmt.Sprintf("Reminder: %s in %d hours", req.ServiceName, req.HoursBeforeStart)
	body := fmt.Sprintf("Reminder: Your booking for %s is coming up in %d hours.", req.ServiceName, req.HoursBeforeStart)

	var returnedID string
	err := s.db.QueryRow(ctx, query,
		notificationID, req.ClientEmail, "booking_reminder", subject, body, "email", "pending",
		req.BookingId, req.HostId, now, now,
	).Scan(&returnedID)

	if err != nil {
		log.Printf("❌ Database error: %v", err)
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to send notification: %v", err),
		}, status.Error(codes.Internal, "failed to send notification")
	}

	log.Printf("✅ Reminder notification sent: %s", notificationID)

	return &pb.SendNotificationResponse{
		Success:        true,
		NotificationId: notificationID,
	}, nil
}

// SendPayoutNotification sends a payout notification
func (s *NotificationServiceServer) SendPayoutNotification(ctx context.Context, req *pb.SendPayoutRequest) (*pb.SendNotificationResponse, error) {
	// Validate required fields
	if req.HostId == "" || req.HostEmail == "" {
		log.Printf("❌ Validation error: Missing required fields")
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: host_id, host_email",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	log.Printf("💰 SendPayoutNotification request received:")
	log.Printf("   Host ID: %s", req.HostId)
	log.Printf("   Amount: %d cents", req.AmountCents)

	notificationID := uuid.New().String()
	now := time.Now().UTC()

	query := `
		INSERT INTO notifications (id, recipient_email, notification_type, subject, body, channel, status, host_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	subject := fmt.Sprintf("Payout Processed - %s %.2f", req.Currency, float64(req.AmountCents)/100)
	body := fmt.Sprintf("Your payout of %s %.2f has been processed and will arrive in 1-2 business days.", req.Currency, float64(req.AmountCents)/100)

	var returnedID string
	err := s.db.QueryRow(ctx, query,
		notificationID, req.HostEmail, "payout_notification", subject, body, "email", "pending",
		req.HostId, now, now,
	).Scan(&returnedID)

	if err != nil {
		log.Printf("❌ Database error: %v", err)
		return &pb.SendNotificationResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to send notification: %v", err),
		}, status.Error(codes.Internal, "failed to send notification")
	}

	log.Printf("✅ Payout notification sent: %s", notificationID)

	return &pb.SendNotificationResponse{
		Success:        true,
		NotificationId: notificationID,
	}, nil
}

// GetNotificationPreferences retrieves notification preferences for a user
func (s *NotificationServiceServer) GetNotificationPreferences(ctx context.Context, req *pb.GetPreferencesRequest) (*pb.GetPreferencesResponse, error) {
	if req.UserId == "" {
		return &pb.GetPreferencesResponse{
			Success:      false,
			ErrorMessage: "user_id is required",
		}, status.Error(codes.InvalidArgument, "user_id required")
	}

	log.Printf("📋 GetNotificationPreferences for user: %s", req.UserId)

	query := `
		SELECT user_id, email_booking_confirmations, email_booking_reminders, email_payout_notifications,
		       sms_booking_confirmations, sms_booking_reminders, push_notifications, created_at, updated_at
		FROM notification_preferences
		WHERE user_id = $1
	`

	var prefs pb.NotificationPreferences
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, query, req.UserId).Scan(
		&prefs.UserId, &prefs.EmailBookingConfirmations, &prefs.EmailBookingReminders, &prefs.EmailPayoutNotifications,
		&prefs.SmsBookingConfirmations, &prefs.SmsBookingReminders, &prefs.PushNotifications, &createdAt, &updatedAt,
	)

	if err != nil {
		// If not found, create default preferences
		if err.Error() == "no rows in result set" {
			log.Printf("⚙️ Creating default preferences for user: %s", req.UserId)
			now := time.Now().UTC()

			createQuery := `
				INSERT INTO notification_preferences (user_id, email_booking_confirmations, email_booking_reminders, email_payout_notifications,
					sms_booking_confirmations, sms_booking_reminders, push_notifications, created_at, updated_at)
				VALUES ($1, true, true, true, false, false, true, $2, $3)
				RETURNING user_id, email_booking_confirmations, email_booking_reminders, email_payout_notifications,
					sms_booking_confirmations, sms_booking_reminders, push_notifications, created_at, updated_at
			`

			err = s.db.QueryRow(ctx, createQuery, req.UserId, now, now).Scan(
				&prefs.UserId, &prefs.EmailBookingConfirmations, &prefs.EmailBookingReminders, &prefs.EmailPayoutNotifications,
				&prefs.SmsBookingConfirmations, &prefs.SmsBookingReminders, &prefs.PushNotifications, &createdAt, &updatedAt,
			)

			if err != nil {
				log.Printf("❌ Error creating preferences: %v", err)
				return &pb.GetPreferencesResponse{
					Success:      false,
					ErrorMessage: fmt.Sprintf("Error: %v", err),
				}, status.Error(codes.Internal, "error creating preferences")
			}
		} else {
			log.Printf("❌ Query error: %v", err)
			return &pb.GetPreferencesResponse{
				Success:      false,
				ErrorMessage: fmt.Sprintf("Error: %v", err),
			}, status.Error(codes.Internal, "database error")
		}
	}

	prefs.CreatedAt = formatTimestamp(createdAt)
	prefs.UpdatedAt = formatTimestamp(updatedAt)

	log.Printf("✅ Preferences retrieved for user: %s", req.UserId)

	return &pb.GetPreferencesResponse{
		Success:      true,
		Preferences: &prefs,
	}, nil
}

// UpdateNotificationPreferences updates notification preferences for a user
func (s *NotificationServiceServer) UpdateNotificationPreferences(ctx context.Context, req *pb.UpdatePreferencesRequest) (*pb.UpdatePreferencesResponse, error) {
	if req.UserId == "" {
		return &pb.UpdatePreferencesResponse{
			Success:      false,
			ErrorMessage: "user_id is required",
		}, status.Error(codes.InvalidArgument, "user_id required")
	}

	log.Printf("⚙️ UpdateNotificationPreferences for user: %s", req.UserId)

	now := time.Now().UTC()

	// Build dynamic update query based on provided fields
	updateQuery := `
		UPDATE notification_preferences
		SET updated_at = $1
	`
	args := []interface{}{now}
	argNum := 2

	if req.EmailBookingConfirmations != nil {
		updateQuery += fmt.Sprintf(", email_booking_confirmations = $%d", argNum)
		args = append(args, *req.EmailBookingConfirmations)
		argNum++
	}
	if req.EmailBookingReminders != nil {
		updateQuery += fmt.Sprintf(", email_booking_reminders = $%d", argNum)
		args = append(args, *req.EmailBookingReminders)
		argNum++
	}
	if req.EmailPayoutNotifications != nil {
		updateQuery += fmt.Sprintf(", email_payout_notifications = $%d", argNum)
		args = append(args, *req.EmailPayoutNotifications)
		argNum++
	}
	if req.SmsBookingConfirmations != nil {
		updateQuery += fmt.Sprintf(", sms_booking_confirmations = $%d", argNum)
		args = append(args, *req.SmsBookingConfirmations)
		argNum++
	}
	if req.SmsBookingReminders != nil {
		updateQuery += fmt.Sprintf(", sms_booking_reminders = $%d", argNum)
		args = append(args, *req.SmsBookingReminders)
		argNum++
	}
	if req.PushNotifications != nil {
		updateQuery += fmt.Sprintf(", push_notifications = $%d", argNum)
		args = append(args, *req.PushNotifications)
		argNum++
	}

	updateQuery += fmt.Sprintf(" WHERE user_id = $%d RETURNING user_id, email_booking_confirmations, email_booking_reminders, email_payout_notifications, sms_booking_confirmations, sms_booking_reminders, push_notifications, created_at, updated_at", argNum)
	args = append(args, req.UserId)

	var prefs pb.NotificationPreferences
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, updateQuery, args...).Scan(
		&prefs.UserId, &prefs.EmailBookingConfirmations, &prefs.EmailBookingReminders, &prefs.EmailPayoutNotifications,
		&prefs.SmsBookingConfirmations, &prefs.SmsBookingReminders, &prefs.PushNotifications, &createdAt, &updatedAt,
	)

	if err != nil {
		log.Printf("❌ Update error: %v", err)
		return &pb.UpdatePreferencesResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to update preferences: %v", err),
		}, status.Error(codes.Internal, "failed to update preferences")
	}

	prefs.CreatedAt = formatTimestamp(createdAt)
	prefs.UpdatedAt = formatTimestamp(updatedAt)

	log.Printf("✅ Preferences updated for user: %s", req.UserId)

	return &pb.UpdatePreferencesResponse{
		Success:      true,
		Preferences: &prefs,
	}, nil
}
