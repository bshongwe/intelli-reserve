package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	pb "github.com/intelli-reserve/backend/gen/go/escrow"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ============================================================================
// CONSTANTS
// ============================================================================

// Error message constants
const (
	errMissingRequired      = "missing_required_fields"
	errHoldNotFound         = "hold_not_found"
	errAccountNotFound      = "escrow_account_not_found"
	errInsufficientBalance  = "insufficient_available_balance"
	errDatabaseFailure      = "database_error"
	errInvalidAmount        = "invalid_amount"
	errPayoutNotFound       = "payout_not_found"
	errDisputeNotFound      = "dispute_not_found"
	errInvalidHoldStatus    = "invalid_hold_status"
	errUnauthorized         = "unauthorized"
	
	// Hold query error messages
	errFailedQueryHolds     = "Failed to query holds"
	errFailedRetrieveHolds  = "Failed to retrieve holds"
	errFailedCountHolds     = "Failed to count holds"
)

// Log message constants
const (
	logMissingFields         = "❌ Validation error: Missing required fields"
	logDBError               = "⚠️ Database error: %v"
	logHoldCreated           = "✅ Hold created successfully: %s"
	logHoldReleased          = "✅ Hold released: %s"
	logHoldRefunded          = "✅ Hold refunded: %s"
	logAccountCreated        = "✅ Escrow account created for host: %s"
	logPayoutRequested       = "✅ Payout requested: %s"
	logTransactionRec        = "📋 Transaction recorded: %s"
	logDisputeOpened         = "📋 Dispute opened: %s"
	logBalanceUpdated        = "💰 Balance updated for host: %s"
	
	// Error log messages
	logErrScanHoldRow        = "[Escrow Service] Error scanning hold row: %v"
	logErrIterateHoldRow     = "[Escrow Service] Error iterating hold row: %v"
)

// Template constants for logging
const (
	logBookingIDTpl   = "   Booking ID: %s"
	logHostIDTpl      = "   Host ID: %s"
	logClientIDTpl    = "   Client ID: %s"
	logAmountTpl      = "   Amount: %d cents"
	logStatusTpl      = "   Status: %s"
	logHoldReasonTpl  = "   Hold Reason: %s"
)

// ============================================================================
// SERVER STRUCT
// ============================================================================

// EscrowServiceServer implements the EscrowService gRPC service
type EscrowServiceServer struct {
	pb.UnimplementedEscrowServiceServer
	db                    *pgxpool.Pool
	paymentGatewayClient  *PayFastClient
}

// NewEscrowServiceServer creates a new EscrowServiceServer
func NewEscrowServiceServer(db *pgxpool.Pool, paymentClient *PayFastClient) *EscrowServiceServer {
	return &EscrowServiceServer{
		db:                   db,
		paymentGatewayClient: paymentClient,
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ensureEscrowAccount creates an escrow account if it doesn't exist
func (s *EscrowServiceServer) ensureEscrowAccount(ctx context.Context, hostID string) (string, error) {
	query := "SELECT id FROM escrow.escrow_accounts WHERE host_id = $1"
	var accountID string
	err := s.db.QueryRow(ctx, query, hostID).Scan(&accountID)

	if err == nil {
		return accountID, nil
	}

	// Create new account
	accountID = uuid.New().String()
	insertQuery := `
		INSERT INTO escrow.escrow_accounts (
			id, host_id, held_balance, available_balance, total_received, total_paid_out,
			account_status, created_at, updated_at
		) VALUES ($1, $2, 0, 0, 0, 0, 'active', NOW(), NOW())
	`

	_, err = s.db.Exec(ctx, insertQuery, accountID, hostID)
	if err != nil {
		return "", err
	}

	log.Printf(logAccountCreated, hostID)
	return accountID, nil
}

// getEscrowAccount retrieves account details
func (s *EscrowServiceServer) getEscrowAccount(ctx context.Context, hostID string) (*pb.EscrowAccount, error) {
	query := `
		SELECT id, host_id, held_balance, available_balance, total_received, total_paid_out,
		       account_status, last_reconciled_at, created_at, updated_at
		FROM escrow.escrow_accounts WHERE host_id = $1
	`

	// Initialize Money structs to avoid nil pointer dereference
	account := &pb.EscrowAccount{
		HeldBalance:      &pb.Money{},
		AvailableBalance: &pb.Money{},
		TotalReceived:    &pb.Money{},
		TotalPaidOut:     &pb.Money{},
	}

	var createdAtTime, updatedAtTime time.Time
	var lastReconciledPtr *time.Time

	err := s.db.QueryRow(ctx, query, hostID).Scan(
		&account.Id, &account.HostId,
		&account.HeldBalance.AmountCents, &account.AvailableBalance.AmountCents,
		&account.TotalReceived.AmountCents, &account.TotalPaidOut.AmountCents,
		&account.AccountStatus, &lastReconciledPtr, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		return nil, err
	}

	account.HeldBalance.Currency = "ZAR"
	account.AvailableBalance.Currency = "ZAR"
	account.TotalReceived.Currency = "ZAR"
	account.TotalPaidOut.Currency = "ZAR"
	account.CreatedAt = createdAtTime.Format(time.RFC3339)
	account.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	if lastReconciledPtr != nil {
		account.LastReconciledAt = lastReconciledPtr.Format(time.RFC3339)
	}

	return account, nil
}

// updateHeldBalance adds or subtracts from held_balance
func (s *EscrowServiceServer) updateHeldBalance(ctx context.Context, hostID string, amount int64, add bool) error {
	operation := "+"
	if !add {
		operation = "-"
	}

	query := fmt.Sprintf(`
		UPDATE escrow.escrow_accounts
		SET held_balance = held_balance %s $1, updated_at = NOW()
		WHERE host_id = $2
	`, operation)

	_, err := s.db.Exec(ctx, query, amount, hostID)
	return err
}

// updateAvailableBalance adds or subtracts from available_balance
func (s *EscrowServiceServer) updateAvailableBalance(ctx context.Context, hostID string, amount int64, add bool) error {
	operation := "+"
	if !add {
		operation = "-"
	}

	query := fmt.Sprintf(`
		UPDATE escrow.escrow_accounts
		SET available_balance = available_balance %s $1, updated_at = NOW()
		WHERE host_id = $2
	`, operation)

	_, err := s.db.Exec(ctx, query, amount, hostID)
	return err
}

// recordTransaction appends an immutable transaction record
func (s *EscrowServiceServer) recordTransaction(ctx context.Context, accountID string, txnType string, amount int64, reference string) error {
	txnID := uuid.New().String()

	// Get current balance
	query := "SELECT available_balance FROM escrow.escrow_accounts WHERE id = $1"
	var beforeBalance int64
	s.db.QueryRow(ctx, query, accountID).Scan(&beforeBalance)

	afterBalance := beforeBalance
	if txnType == "hold_placed" {
		afterBalance = beforeBalance + amount
	} else if txnType == "hold_released" {
		afterBalance = beforeBalance - amount
	}

	insertQuery := `
		INSERT INTO escrow.escrow_transactions (
			id, escrow_account_id, transaction_type, amount, booking_id, balance_before,
			balance_after, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
	`

	_, err := s.db.Exec(ctx, insertQuery, txnID, accountID, txnType, amount, reference, beforeBalance, afterBalance)

	if err == nil {
		log.Printf(logTransactionRec, txnID)
	}

	return err
}

// ============================================================================
// RPC METHOD: CreateHold
// ============================================================================

// CreateHold creates a new escrow hold for a booking
func (s *EscrowServiceServer) CreateHold(ctx context.Context, req *pb.CreateHoldRequest) (*pb.CreateHoldResponse, error) {
	// Validate required fields
	if req.BookingId == "" || req.HostId == "" || req.ClientId == "" || req.GrossAmountCents <= 0 {
		log.Printf(logMissingFields)
		return &pb.CreateHoldResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	log.Printf("📝 CreateHold request received:")
	log.Printf(logBookingIDTpl, req.BookingId)
	log.Printf(logHostIDTpl, req.HostId)
	log.Printf(logAmountTpl, req.GrossAmountCents)

	holdID := uuid.New().String()
	now := time.Now().UTC()

	// Ensure escrow account exists
	accountID, err := s.ensureEscrowAccount(ctx, req.HostId)
	if err != nil {
		log.Printf(logDBError, err)
		return &pb.CreateHoldResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	hostAmount := req.GrossAmountCents - req.PlatformFeeCents

	// Process payment with PayFast payment gateway if client available
	var paymentRef string
	if s.paymentGatewayClient != nil {
		log.Printf("💳 Processing payment hold with PayFast...")
		paymentReq := &CreatePaymentHoldRequest{
			Amount:           req.GrossAmountCents,
			Description:      fmt.Sprintf("Booking %s - IntelliReserve Service", req.BookingId),
			CustomerID:       req.ClientId,
			CustomerEmail:    req.CustomerEmail,
			BankAccountToken: req.BankAccountToken,
		}

		paymentResp, err := s.paymentGatewayClient.CreatePaymentHold(paymentReq)
		if err != nil {
			log.Printf("❌ Payment hold failed: %v", err)
			return &pb.CreateHoldResponse{
				Success:      false,
				ErrorMessage: "payment_processing_failed",
			}, status.Error(codes.Internal, fmt.Sprintf("Payment processing failed: %v", err))
		}

		paymentRef = paymentResp.ReferenceID
		log.Printf("✅ Payment reference: %s", paymentRef)
	}

	// Insert hold
	query := `
		INSERT INTO escrow.escrow_holds (
			id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
			hold_status, hold_reason, payment_reference, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'held', $8, $9, $10, $11)
		RETURNING id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		          hold_status, payment_reference, created_at, updated_at
	`

	var hold pb.EscrowHold
	// Initialize Money structs to avoid nil pointer dereference
	hold.GrossAmount = &pb.Money{}
	hold.PlatformFee = &pb.Money{}
	hold.HostAmount = &pb.Money{}
	var createdAtTime, updatedAtTime time.Time

	err = s.db.QueryRow(ctx, query,
		holdID, req.BookingId, req.HostId, req.ClientId, req.GrossAmountCents,
		req.PlatformFeeCents, hostAmount, req.HoldReason, paymentRef, now, now,
	).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
		&hold.HoldStatus, &hold.PaymentReference, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		// Handle duplicate key error (hold already exists for this booking)
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"escrow_holds_booking_id_key\" (SQLSTATE 23505)" {
			log.Printf("⚠️ Hold already exists for booking %s, retrieving existing hold", req.BookingId)
			// Try to fetch the existing hold
			existingHold, err := s.getExistingHold(ctx, req.BookingId)
			if err == nil {
				return &pb.CreateHoldResponse{
					Success: true,
					Hold:    existingHold,
				}, nil
			}
		}
		
		log.Printf(logDBError, err)
		// If payment was created but DB insert failed, attempt to refund
		if paymentRef != "" && s.paymentGatewayClient != nil {
			log.Printf("⚠️ Database insert failed, refunding payment %s", paymentRef)
			_ = s.paymentGatewayClient.RefundPayment(paymentRef, req.GrossAmountCents)
		}
		return &pb.CreateHoldResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	// Update held balance
	err = s.updateHeldBalance(ctx, req.HostId, req.GrossAmountCents, true)
	if err != nil {
		log.Printf(logDBError, err)
	}

	// Record transaction
	s.recordTransaction(ctx, accountID, "hold_placed", req.GrossAmountCents, holdID)

	hold.CreatedAt = createdAtTime.Format(time.RFC3339)
	hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	hold.GrossAmount.Currency = "ZAR"
	hold.PlatformFee.Currency = "ZAR"
	hold.HostAmount.Currency = "ZAR"

	log.Printf(logHoldCreated, holdID)

	return &pb.CreateHoldResponse{
		Success: true,
		Hold:    &hold,
	}, nil
}

// Helper function to retrieve existing hold by booking ID
func (s *EscrowServiceServer) getExistingHold(ctx context.Context, bookingID string) (*pb.EscrowHold, error) {
	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, payment_reference, created_at, updated_at
		FROM escrow.escrow_holds
		WHERE booking_id = $1
		LIMIT 1
	`

	var hold pb.EscrowHold
	hold.GrossAmount = &pb.Money{}
	hold.PlatformFee = &pb.Money{}
	hold.HostAmount = &pb.Money{}
	var createdAtTime, updatedAtTime time.Time

	err := s.db.QueryRow(ctx, query, bookingID).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
		&hold.HoldStatus, &hold.PaymentReference, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		return nil, err
	}

	hold.CreatedAt = createdAtTime.Format(time.RFC3339)
	hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	hold.GrossAmount.Currency = "ZAR"
	hold.PlatformFee.Currency = "ZAR"
	hold.HostAmount.Currency = "ZAR"

	return &hold, nil
}

// ============================================================================
// RPC METHOD: GetHold
// ============================================================================

// GetHold retrieves a hold by ID
func (s *EscrowServiceServer) GetHold(ctx context.Context, req *pb.GetHoldRequest) (*pb.GetHoldResponse, error) {
	if req.HoldId == "" {
		return &pb.GetHoldResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, refunded_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE id = $1
	`

	var hold pb.EscrowHold
	// Initialize Money structs to avoid nil pointer dereference
	hold.GrossAmount = &pb.Money{}
	hold.PlatformFee = &pb.Money{}
	hold.HostAmount = &pb.Money{}
	var createdAtTime, updatedAtTime time.Time
	var releasedAt, refundedAt *time.Time

	err := s.db.QueryRow(ctx, query, req.HoldId).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
		&hold.HoldStatus, &releasedAt, &refundedAt, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		return &pb.GetHoldResponse{
			Success:      false,
			ErrorMessage: errHoldNotFound,
		}, status.Error(codes.NotFound, errHoldNotFound)
	}

	hold.CreatedAt = createdAtTime.Format(time.RFC3339)
	hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	if releasedAt != nil {
		hold.ReleasedAt = releasedAt.Format(time.RFC3339)
	}
	if refundedAt != nil {
		hold.RefundedAt = refundedAt.Format(time.RFC3339)
	}
	hold.GrossAmount.Currency = "ZAR"
	hold.PlatformFee.Currency = "ZAR"
	hold.HostAmount.Currency = "ZAR"

	return &pb.GetHoldResponse{
		Success: true,
		Hold:    &hold,
	}, nil
}

// ============================================================================
// RPC METHOD: GetHoldsByBookingId
// ============================================================================

// GetHoldsByBookingId retrieves all holds for a specific booking
func (s *EscrowServiceServer) GetHoldsByBookingId(ctx context.Context, req *pb.GetHoldsByBookingIdRequest) (*pb.GetHoldsByBookingIdResponse, error) {
	if req.BookingId == "" {
		return &pb.GetHoldsByBookingIdResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, refunded_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE booking_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(ctx, query, req.BookingId)
	if err != nil {
		log.Printf("[Escrow Service] Error querying holds for booking %s: %v", req.BookingId, err)
		return &pb.GetHoldsByBookingIdResponse{
			Success:      false,
			ErrorMessage: errFailedQueryHolds,
		}, status.Error(codes.Internal, errFailedQueryHolds)
	}
	defer rows.Close()

	var holds []*pb.EscrowHold

	for rows.Next() {
		var hold pb.EscrowHold
		// Initialize Money structs to avoid nil pointer dereference
		hold.GrossAmount = &pb.Money{}
		hold.PlatformFee = &pb.Money{}
		hold.HostAmount = &pb.Money{}
		var createdAtTime, updatedAtTime time.Time
		var releasedAt, refundedAt *time.Time

		err := rows.Scan(
			&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
			&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
			&hold.HoldStatus, &releasedAt, &refundedAt, &createdAtTime, &updatedAtTime,
		)

		if err != nil {
			log.Printf(logErrScanHoldRow, err)
			continue
		}

		hold.CreatedAt = createdAtTime.Format(time.RFC3339)
		hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
		if releasedAt != nil {
			hold.ReleasedAt = releasedAt.Format(time.RFC3339)
		}
		if refundedAt != nil {
			hold.RefundedAt = refundedAt.Format(time.RFC3339)
		}

		holds = append(holds, &hold)
	}

	if err = rows.Err(); err != nil {
		log.Printf(logErrIterateHoldRow, err)
		return &pb.GetHoldsByBookingIdResponse{
			Success:      false,
			ErrorMessage: errFailedRetrieveHolds,
		}, status.Error(codes.Internal, errFailedRetrieveHolds)
	}

	return &pb.GetHoldsByBookingIdResponse{
		Success: true,
		Holds:   holds,
	}, nil
}

// ============================================================================
// RPC METHOD: GetHoldsByClientId
// ============================================================================

// GetHoldsByClientId retrieves all holds for a specific client with pagination
func (s *EscrowServiceServer) GetHoldsByClientId(ctx context.Context, req *pb.GetHoldsByClientIdRequest) (*pb.GetHoldsByClientIdResponse, error) {
	if req.ClientId == "" {
		return &pb.GetHoldsByClientIdResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Get total count first
	countQuery := `SELECT COUNT(*) FROM escrow.escrow_holds WHERE client_id = $1`
	var totalCount int32
	err := s.db.QueryRow(ctx, countQuery, req.ClientId).Scan(&totalCount)
	if err != nil {
		log.Printf("[Escrow Service] Error counting holds for client %s: %v", req.ClientId, err)
		return &pb.GetHoldsByClientIdResponse{
			Success:      false,
			ErrorMessage: errFailedCountHolds,
		}, status.Error(codes.Internal, errFailedCountHolds)
	}

	// Set default and max limits
	limit := req.Limit
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, refunded_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE client_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, req.ClientId, limit, offset)
	if err != nil {
		log.Printf("[Escrow Service] Error querying holds for client %s: %v", req.ClientId, err)
		return &pb.GetHoldsByClientIdResponse{
			Success:      false,
			ErrorMessage: errFailedQueryHolds,
		}, status.Error(codes.Internal, errFailedQueryHolds)
	}
	defer rows.Close()

	var holds []*pb.EscrowHold

	for rows.Next() {
		var hold pb.EscrowHold
		// Initialize Money structs to avoid nil pointer dereference
		hold.GrossAmount = &pb.Money{}
		hold.PlatformFee = &pb.Money{}
		hold.HostAmount = &pb.Money{}
		var createdAtTime, updatedAtTime time.Time
		var releasedAt, refundedAt *time.Time

		err := rows.Scan(
			&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
			&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
			&hold.HoldStatus, &releasedAt, &refundedAt, &createdAtTime, &updatedAtTime,
		)

		if err != nil {
			log.Printf(logErrScanHoldRow, err)
			continue
		}

		hold.CreatedAt = createdAtTime.Format(time.RFC3339)
		hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
		if releasedAt != nil {
			hold.ReleasedAt = releasedAt.Format(time.RFC3339)
		}
		if refundedAt != nil {
			hold.RefundedAt = refundedAt.Format(time.RFC3339)
		}

		holds = append(holds, &hold)
	}

	if err = rows.Err(); err != nil {
		log.Printf(logErrIterateHoldRow, err)
		return &pb.GetHoldsByClientIdResponse{
			Success:      false,
			ErrorMessage: errFailedRetrieveHolds,
		}, status.Error(codes.Internal, errFailedRetrieveHolds)
	}

	return &pb.GetHoldsByClientIdResponse{
		Success:    true,
		Holds:      holds,
		TotalCount: totalCount,
	}, nil
}

// ============================================================================
// RPC METHOD: GetHoldsByHostId
// ============================================================================

// GetHoldsByHostId retrieves all holds for a specific host with pagination
func (s *EscrowServiceServer) GetHoldsByHostId(ctx context.Context, req *pb.GetHoldsByHostIdRequest) (*pb.GetHoldsByHostIdResponse, error) {
	if req.HostId == "" {
		return &pb.GetHoldsByHostIdResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Get total count first
	countQuery := `SELECT COUNT(*) FROM escrow.escrow_holds WHERE host_id = $1`
	var totalCount int32
	err := s.db.QueryRow(ctx, countQuery, req.HostId).Scan(&totalCount)
	if err != nil {
		log.Printf("[Escrow Service] Error counting holds for host %s: %v", req.HostId, err)
		return &pb.GetHoldsByHostIdResponse{
			Success:      false,
			ErrorMessage: errFailedCountHolds,
		}, status.Error(codes.Internal, errFailedCountHolds)
	}

	// Set default and max limits
	limit := req.Limit
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, refunded_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE host_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, req.HostId, limit, offset)
	if err != nil {
		log.Printf("[Escrow Service] Error querying holds for host %s: %v", req.HostId, err)
		return &pb.GetHoldsByHostIdResponse{
			Success:      false,
			ErrorMessage: errFailedQueryHolds,
		}, status.Error(codes.Internal, errFailedQueryHolds)
	}
	defer rows.Close()

	var holds []*pb.EscrowHold

	for rows.Next() {
		var hold pb.EscrowHold
		// Initialize Money structs to avoid nil pointer dereference
		hold.GrossAmount = &pb.Money{}
		hold.PlatformFee = &pb.Money{}
		hold.HostAmount = &pb.Money{}
		var createdAtTime, updatedAtTime time.Time
		var releasedAt, refundedAt *time.Time

		err := rows.Scan(
			&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
			&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
			&hold.HoldStatus, &releasedAt, &refundedAt, &createdAtTime, &updatedAtTime,
		)

		if err != nil {
			log.Printf(logErrScanHoldRow, err)
			continue
		}

		hold.CreatedAt = createdAtTime.Format(time.RFC3339)
		hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
		if releasedAt != nil {
			hold.ReleasedAt = releasedAt.Format(time.RFC3339)
		}
		if refundedAt != nil {
			hold.RefundedAt = refundedAt.Format(time.RFC3339)
		}
		hold.GrossAmount.Currency = "ZAR"
		hold.PlatformFee.Currency = "ZAR"
		hold.HostAmount.Currency = "ZAR"

		holds = append(holds, &hold)
	}

	if err = rows.Err(); err != nil {
		log.Printf(logErrIterateHoldRow, err)
		return &pb.GetHoldsByHostIdResponse{
			Success:      false,
			ErrorMessage: errFailedRetrieveHolds,
		}, status.Error(codes.Internal, errFailedRetrieveHolds)
	}

	return &pb.GetHoldsByHostIdResponse{
		Success:    true,
		Holds:      holds,
		TotalCount: totalCount,
	}, nil
}

// ============================================================================
// RPC METHOD: GetAllHolds
// ============================================================================

// GetAllHolds retrieves all holds across the system with optional status filtering and pagination
func (s *EscrowServiceServer) GetAllHolds(ctx context.Context, req *pb.GetAllHoldsRequest) (*pb.GetAllHoldsResponse, error) {
	// Build the base query with optional status filter
	statusFilter := ""
	if req.StatusFilter != "" && req.StatusFilter != "all" {
		statusFilter = fmt.Sprintf(" AND hold_status = '%s'", req.StatusFilter)
	}

	// Get total count first
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM escrow.escrow_holds WHERE 1=1%s`, statusFilter)
	var totalCount int32
	err := s.db.QueryRow(ctx, countQuery).Scan(&totalCount)
	if err != nil {
		log.Printf("[Escrow Service] Error counting all holds: %v", err)
		return &pb.GetAllHoldsResponse{
			Success:      false,
			ErrorMessage: errFailedCountHolds,
		}, status.Error(codes.Internal, errFailedCountHolds)
	}

	// Set default and max limits
	limit := req.Limit
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	// Query all holds with optional status filter
	query := fmt.Sprintf(`
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, refunded_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE 1=1%s
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, statusFilter)

	rows, err := s.db.Query(ctx, query, limit, offset)
	if err != nil {
		log.Printf("[Escrow Service] Error querying all holds: %v", err)
		return &pb.GetAllHoldsResponse{
			Success:      false,
			ErrorMessage: errFailedQueryHolds,
		}, status.Error(codes.Internal, errFailedQueryHolds)
	}
	defer rows.Close()

	var holds []*pb.EscrowHold

	for rows.Next() {
		var hold pb.EscrowHold
		// Initialize Money structs to avoid nil pointer dereference
		hold.GrossAmount = &pb.Money{}
		hold.PlatformFee = &pb.Money{}
		hold.HostAmount = &pb.Money{}
		var createdAtTime, updatedAtTime time.Time
		var releasedAt, refundedAt *time.Time

		err := rows.Scan(
			&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
			&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
			&hold.HoldStatus, &releasedAt, &refundedAt, &createdAtTime, &updatedAtTime,
		)

		if err != nil {
			log.Printf(logErrScanHoldRow, err)
			continue
		}

		hold.CreatedAt = createdAtTime.Format(time.RFC3339)
		hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
		if releasedAt != nil {
			hold.ReleasedAt = releasedAt.Format(time.RFC3339)
		}
		if refundedAt != nil {
			hold.RefundedAt = refundedAt.Format(time.RFC3339)
		}
		hold.GrossAmount.Currency = "ZAR"
		hold.PlatformFee.Currency = "ZAR"
		hold.HostAmount.Currency = "ZAR"

		holds = append(holds, &hold)
	}

	if err = rows.Err(); err != nil {
		log.Printf(logErrIterateHoldRow, err)
		return &pb.GetAllHoldsResponse{
			Success:      false,
			ErrorMessage: errFailedRetrieveHolds,
		}, status.Error(codes.Internal, errFailedRetrieveHolds)
	}

	return &pb.GetAllHoldsResponse{
		Success:    true,
		Holds:      holds,
		TotalCount: totalCount,
	}, nil
}

// ============================================================================
// RPC METHOD: ReleaseHold
// ============================================================================

// ReleaseHold marks a hold as released (money becomes available for payout)
func (s *EscrowServiceServer) ReleaseHold(ctx context.Context, req *pb.ReleaseHoldRequest) (*pb.ReleaseHoldResponse, error) {
	if req.HoldId == "" || req.HostId == "" {
		return &pb.ReleaseHoldResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	now := time.Now().UTC()

	// Get hold details
	query := `
		SELECT id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		       hold_status, released_at, created_at, updated_at
		FROM escrow.escrow_holds WHERE id = $1 AND host_id = $2
	`

	var hold pb.EscrowHold
	// Initialize Money structs to avoid nil pointer dereference
	hold.GrossAmount = &pb.Money{}
	hold.PlatformFee = &pb.Money{}
	hold.HostAmount = &pb.Money{}
	var hostAmount int64
	var createdAtTime, updatedAtTime time.Time
	var releasedAt *time.Time

	err := s.db.QueryRow(ctx, query, req.HoldId, req.HostId).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hostAmount,
		&hold.HoldStatus, &releasedAt, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		return &pb.ReleaseHoldResponse{
			Success:      false,
			ErrorMessage: errHoldNotFound,
		}, status.Error(codes.NotFound, errHoldNotFound)
	}

	// Update hold status
	updateQuery := `
		UPDATE escrow.escrow_holds
		SET hold_status = 'released', released_at = $1, updated_at = $2
		WHERE id = $3
		RETURNING id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		          hold_status, released_at, created_at, updated_at
	`

	var releasedAtTime time.Time

	err = s.db.QueryRow(ctx, updateQuery, now, now, req.HoldId).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
		&hold.HoldStatus, &releasedAtTime, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		log.Printf(logDBError, err)
		return &pb.ReleaseHoldResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	// Transfer from held to available
	s.updateHeldBalance(ctx, req.HostId, hostAmount, false)
	s.updateAvailableBalance(ctx, req.HostId, hostAmount, true)

	log.Printf(logBalanceUpdated, req.HostId)

	// Get updated account
	account, err := s.getEscrowAccount(ctx, req.HostId)
	if err != nil {
		log.Printf(logDBError, err)
	}

	hold.CreatedAt = createdAtTime.Format(time.RFC3339)
	hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	hold.ReleasedAt = releasedAtTime.Format(time.RFC3339)
	hold.GrossAmount.Currency = "ZAR"
	hold.PlatformFee.Currency = "ZAR"
	hold.HostAmount.Currency = "ZAR"

	log.Printf(logHoldReleased, req.HoldId)

	return &pb.ReleaseHoldResponse{
		Success:        true,
		Hold:           &hold,
		UpdatedAccount: account,
	}, nil
}

// ============================================================================
// RPC METHOD: RefundHold
// ============================================================================

// RefundHold marks a hold as refunded (money returned to client)
func (s *EscrowServiceServer) RefundHold(ctx context.Context, req *pb.RefundHoldRequest) (*pb.RefundHoldResponse, error) {
	if req.HoldId == "" {
		return &pb.RefundHoldResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	now := time.Now().UTC()

	query := `
		UPDATE escrow.escrow_holds
		SET hold_status = 'refunded', refunded_at = $1, refund_reason = $2, updated_at = $3
		WHERE id = $4
		RETURNING id, booking_id, host_id, client_id, gross_amount, platform_fee, host_amount,
		          hold_status, refunded_at, created_at, updated_at
	`

	var hold pb.EscrowHold
	// Initialize Money structs to avoid nil pointer dereference
	hold.GrossAmount = &pb.Money{}
	hold.PlatformFee = &pb.Money{}
	hold.HostAmount = &pb.Money{}
	var createdAtTime, updatedAtTime, refundedAtTime time.Time

	err := s.db.QueryRow(ctx, query, now, req.Reason, now, req.HoldId).Scan(
		&hold.Id, &hold.BookingId, &hold.HostId, &hold.ClientId,
		&hold.GrossAmount.AmountCents, &hold.PlatformFee.AmountCents, &hold.HostAmount.AmountCents,
		&hold.HoldStatus, &refundedAtTime, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		log.Printf(logDBError, err)
		return &pb.RefundHoldResponse{
			Success:      false,
			ErrorMessage: errHoldNotFound,
		}, status.Error(codes.NotFound, errHoldNotFound)
	}

	// Reduce held balance
	s.updateHeldBalance(ctx, hold.HostId, hold.GrossAmount.AmountCents, false)

	hold.CreatedAt = createdAtTime.Format(time.RFC3339)
	hold.UpdatedAt = updatedAtTime.Format(time.RFC3339)
	hold.RefundedAt = refundedAtTime.Format(time.RFC3339)
	hold.GrossAmount.Currency = "ZAR"
	hold.PlatformFee.Currency = "ZAR"
	hold.HostAmount.Currency = "ZAR"

	log.Printf(logHoldRefunded, req.HoldId)

	return &pb.RefundHoldResponse{
		Success: true,
		Hold:    &hold,
	}, nil
}

// ============================================================================
// RPC METHOD: GetEscrowAccount
// ============================================================================

// GetEscrowAccount retrieves or creates escrow account for a host
func (s *EscrowServiceServer) GetEscrowAccount(ctx context.Context, req *pb.GetEscrowAccountRequest) (*pb.GetEscrowAccountResponse, error) {
	if req.HostId == "" {
		return &pb.GetEscrowAccountResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Ensure account exists (create if needed)
	_, err := s.ensureEscrowAccount(ctx, req.HostId)
	if err != nil {
		return &pb.GetEscrowAccountResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	account, err := s.getEscrowAccount(ctx, req.HostId)
	if err != nil {
		return &pb.GetEscrowAccountResponse{
			Success:      false,
			ErrorMessage: errAccountNotFound,
		}, status.Error(codes.NotFound, errAccountNotFound)
	}

	return &pb.GetEscrowAccountResponse{
		Success: true,
		Account: account,
	}, nil
}

// ============================================================================
// RPC METHOD: GetAvailableBalance
// ============================================================================

// GetAvailableBalance retrieves available balance for payout
func (s *EscrowServiceServer) GetAvailableBalance(ctx context.Context, req *pb.GetAvailableBalanceRequest) (*pb.GetAvailableBalanceResponse, error) {
	if req.HostId == "" {
		return &pb.GetAvailableBalanceResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	query := "SELECT available_balance FROM escrow.escrow_accounts WHERE host_id = $1"
	var balance int64
	err := s.db.QueryRow(ctx, query, req.HostId).Scan(&balance)
	if err != nil {
		return &pb.GetAvailableBalanceResponse{
			Success:      false,
			ErrorMessage: errAccountNotFound,
		}, status.Error(codes.NotFound, errAccountNotFound)
	}

	return &pb.GetAvailableBalanceResponse{
		Success: true,
		AvailableBalance: &pb.Money{
			AmountCents: balance,
			Currency:    "ZAR",
		},
	}, nil
}

// ============================================================================
// RPC METHOD: RequestPayout
// ============================================================================

// RequestPayout initiates a payout to host's bank account
func (s *EscrowServiceServer) RequestPayout(ctx context.Context, req *pb.RequestPayoutRequest) (*pb.RequestPayoutResponse, error) {
	if req.HostId == "" || req.AmountCents <= 0 {
		return &pb.RequestPayoutResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Verify sufficient balance
	query := "SELECT available_balance FROM escrow.escrow_accounts WHERE host_id = $1"
	var availableBalance int64
	err := s.db.QueryRow(ctx, query, req.HostId).Scan(&availableBalance)
	if err != nil {
		return &pb.RequestPayoutResponse{
			Success:      false,
			ErrorMessage: errAccountNotFound,
		}, status.Error(codes.NotFound, errAccountNotFound)
	}

	if availableBalance < req.AmountCents {
		return &pb.RequestPayoutResponse{
			Success:      false,
			ErrorMessage: errInsufficientBalance,
		}, status.Error(codes.FailedPrecondition, errInsufficientBalance)
	}

	payoutID := uuid.New().String()
	now := time.Now().UTC()

	insertQuery := `
		INSERT INTO escrow.payouts (
			id, host_id, escrow_account_id, amount, payout_status, requested_at, created_at, updated_at
		) VALUES ($1, $2, (SELECT id FROM escrow.escrow_accounts WHERE host_id = $3), $4, 'pending', $5, $6, $7)
		RETURNING id, host_id, amount, payout_status, requested_at, created_at, updated_at
	`

	var payout pb.Payout
	var createdAtTime, updatedAtTime, requestedAtTime time.Time

	err = s.db.QueryRow(ctx, insertQuery, payoutID, req.HostId, req.HostId, req.AmountCents, now, now, now).Scan(
		&payout.Id, &payout.HostId, &payout.Amount.AmountCents, &payout.PayoutStatus,
		&requestedAtTime, &createdAtTime, &updatedAtTime,
	)

	if err != nil {
		log.Printf(logDBError, err)
		return &pb.RequestPayoutResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	// Reduce available balance
	updateQuery := "UPDATE escrow.escrow_accounts SET available_balance = available_balance - $1 WHERE host_id = $2"
	s.db.Exec(ctx, updateQuery, req.AmountCents, req.HostId)

	payout.Amount.Currency = "ZAR"
	payout.CreatedAt = createdAtTime.Format(time.RFC3339)
	payout.RequestedAt = requestedAtTime.Format(time.RFC3339)

	log.Printf(logPayoutRequested, payoutID)

	return &pb.RequestPayoutResponse{
		Success: true,
		Payout:  &payout,
	}, nil
}

// ============================================================================
// RPC METHOD: GetPayoutStatus
// ============================================================================

// GetPayoutStatus retrieves payout status
func (s *EscrowServiceServer) GetPayoutStatus(ctx context.Context, req *pb.GetPayoutStatusRequest) (*pb.GetPayoutStatusResponse, error) {
	if req.PayoutId == "" {
		return &pb.GetPayoutStatusResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	query := `
		SELECT id, host_id, amount, payout_status, external_transaction_id, failure_reason,
		       requested_at, processing_started_at, completed_at, created_at
		FROM escrow.payouts WHERE id = $1
	`

	var payout pb.Payout
	var createdAtTime, requestedAtTime time.Time
	var processingStartedAtPtr, completedAtPtr *time.Time

	err := s.db.QueryRow(ctx, query, req.PayoutId).Scan(
		&payout.Id, &payout.HostId, &payout.Amount.AmountCents, &payout.PayoutStatus,
		&payout.ExternalTransactionId, &payout.FailureReason,
		&requestedAtTime, &processingStartedAtPtr, &completedAtPtr, &createdAtTime,
	)

	if err != nil {
		return &pb.GetPayoutStatusResponse{
			Success:      false,
			ErrorMessage: errPayoutNotFound,
		}, status.Error(codes.NotFound, errPayoutNotFound)
	}

	payout.Amount.Currency = "ZAR"
	payout.CreatedAt = createdAtTime.Format(time.RFC3339)
	payout.RequestedAt = requestedAtTime.Format(time.RFC3339)
	if processingStartedAtPtr != nil {
		payout.ProcessingStartedAt = processingStartedAtPtr.Format(time.RFC3339)
	}
	if completedAtPtr != nil {
		payout.CompletedAt = completedAtPtr.Format(time.RFC3339)
	}

	return &pb.GetPayoutStatusResponse{
		Success: true,
		Payout:  &payout,
	}, nil
}

// ============================================================================
// RPC METHOD: GetPayoutHistory
// ============================================================================

// GetPayoutHistory retrieves payout history for a host
func (s *EscrowServiceServer) GetPayoutHistory(ctx context.Context, req *pb.GetPayoutHistoryRequest) (*pb.GetPayoutHistoryResponse, error) {
	if req.HostId == "" {
		return &pb.GetPayoutHistoryResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM escrow.payouts WHERE host_id = $1"
	var totalCount int32
	err := s.db.QueryRow(ctx, countQuery, req.HostId).Scan(&totalCount)
	if err != nil {
		log.Printf("❌ Error counting payouts: %v", err)
	}

	// Get paginated results
	query := `
		SELECT id, host_id, amount, payout_status, external_transaction_id, failure_reason,
		       requested_at, processing_started_at, completed_at, created_at
		FROM escrow.payouts WHERE host_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, req.HostId, req.Limit, req.Offset)
	if err != nil {
		log.Printf("❌ Database error in GetPayoutHistory: %v", err)
		return &pb.GetPayoutHistoryResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}
	defer rows.Close()

	var payouts []*pb.Payout

	for rows.Next() {
		var payout pb.Payout
		// Initialize Money struct to avoid nil pointer dereference
		payout.Amount = &pb.Money{}
		var createdAtTime, requestedAtTime time.Time
		var processingStartedAtPtr, completedAtPtr *time.Time

		err := rows.Scan(
			&payout.Id, &payout.HostId, &payout.Amount.AmountCents, &payout.PayoutStatus,
			&payout.ExternalTransactionId, &payout.FailureReason,
			&requestedAtTime, &processingStartedAtPtr, &completedAtPtr, &createdAtTime,
		)
		if err != nil {
			log.Printf("❌ Error scanning payout row: %v", err)
			continue
		}

		payout.Amount.Currency = "ZAR"
		payout.CreatedAt = createdAtTime.Format(time.RFC3339)
		payout.RequestedAt = requestedAtTime.Format(time.RFC3339)
		if processingStartedAtPtr != nil {
			payout.ProcessingStartedAt = processingStartedAtPtr.Format(time.RFC3339)
		}
		if completedAtPtr != nil {
			payout.CompletedAt = completedAtPtr.Format(time.RFC3339)
		}

		payouts = append(payouts, &payout)
	}

	// Check for errors from iterating over rows
	if err := rows.Err(); err != nil {
		log.Printf("❌ Error iterating rows in GetPayoutHistory: %v", err)
		return &pb.GetPayoutHistoryResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	return &pb.GetPayoutHistoryResponse{
		Success:    true,
		Payouts:    payouts,
		TotalCount: totalCount,
	}, nil
}

// ============================================================================
// RPC METHOD: GetTransactionHistory
// ============================================================================

// GetTransactionHistory retrieves transaction audit log
func (s *EscrowServiceServer) GetTransactionHistory(ctx context.Context, req *pb.GetTransactionHistoryRequest) (*pb.GetTransactionHistoryResponse, error) {
	if req.HostId == "" {
		return &pb.GetTransactionHistoryResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	// Get total count
	countQuery := `
		SELECT COUNT(*) FROM escrow.escrow_transactions WHERE escrow_account_id = (
			SELECT id FROM escrow.escrow_accounts WHERE host_id = $1
		)
	`
	var totalCount int32
	s.db.QueryRow(ctx, countQuery, req.HostId).Scan(&totalCount)

	// Get paginated results
	query := `
		SELECT id, transaction_type, amount, booking_id, payout_id, balance_before, balance_after, description, created_at
		FROM escrow.escrow_transactions
		WHERE escrow_account_id = (SELECT id FROM escrow.escrow_accounts WHERE host_id = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, req.HostId, req.Limit, req.Offset)
	if err != nil {
		return &pb.GetTransactionHistoryResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}
	defer rows.Close()

	var transactions []*pb.EscrowTransaction

	for rows.Next() {
		var txn pb.EscrowTransaction
		// Initialize Money structs to avoid nil pointer dereference
		txn.Amount = &pb.Money{}
		txn.BalanceBefore = &pb.Money{}
		txn.BalanceAfter = &pb.Money{}
		var createdAtTime time.Time

		err := rows.Scan(
			&txn.Id, &txn.TransactionType, &txn.Amount.AmountCents, &txn.BookingId, &txn.PayoutId,
			&txn.BalanceBefore.AmountCents, &txn.BalanceAfter.AmountCents, &txn.Description, &createdAtTime,
		)
		if err != nil {
			continue
		}

		txn.Amount.Currency = "ZAR"
		txn.BalanceBefore.Currency = "ZAR"
		txn.BalanceAfter.Currency = "ZAR"
		txn.CreatedAt = createdAtTime.Format(time.RFC3339)

		transactions = append(transactions, &txn)
	}

	return &pb.GetTransactionHistoryResponse{
		Success:      true,
		Transactions: transactions,
		TotalCount:   totalCount,
	}, nil
}

// ============================================================================
// RPC METHOD: OpenDispute
// ============================================================================

// OpenDispute opens a dispute for a booking
func (s *EscrowServiceServer) OpenDispute(ctx context.Context, req *pb.OpenDisputeRequest) (*pb.OpenDisputeResponse, error) {
	if req.BookingId == "" || req.HostId == "" || req.ClientId == "" || req.DisputeReason == "" {
		return &pb.OpenDisputeResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	disputeID := uuid.New().String()
	now := time.Now().UTC()

	query := `
		INSERT INTO escrow.disputes (
			id, booking_id, host_id, client_id, dispute_reason, dispute_description,
			dispute_status, opened_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9)
		RETURNING id, booking_id, host_id, client_id, dispute_reason, dispute_description,
		          dispute_status, opened_at, created_at
	`

	var dispute pb.Dispute
	var createdAtTime, openedAtTime time.Time

	err := s.db.QueryRow(ctx, query, disputeID, req.BookingId, req.HostId, req.ClientId,
		req.DisputeReason, req.DisputeDescription, now, now, now).Scan(
		&dispute.Id, &dispute.BookingId, &dispute.HostId, &dispute.ClientId,
		&dispute.DisputeReason, &dispute.DisputeDescription, &dispute.DisputeStatus,
		&openedAtTime, &createdAtTime,
	)

	if err != nil {
		log.Printf(logDBError, err)
		return &pb.OpenDisputeResponse{
			Success:      false,
			ErrorMessage: errDatabaseFailure,
		}, status.Error(codes.Internal, errDatabaseFailure)
	}

	dispute.CreatedAt = createdAtTime.Format(time.RFC3339)
	dispute.OpenedAt = openedAtTime.Format(time.RFC3339)

	log.Printf(logDisputeOpened, disputeID)

	return &pb.OpenDisputeResponse{
		Success: true,
		Dispute: &dispute,
	}, nil
}

// ============================================================================
// RPC METHOD: GetDisputeStatus
// ============================================================================

// GetDisputeStatus retrieves dispute status
func (s *EscrowServiceServer) GetDisputeStatus(ctx context.Context, req *pb.GetDisputeStatusRequest) (*pb.GetDisputeStatusResponse, error) {
	if req.DisputeId == "" {
		return &pb.GetDisputeStatusResponse{
			Success:      false,
			ErrorMessage: errMissingRequired,
		}, status.Error(codes.InvalidArgument, errMissingRequired)
	}

	query := `
		SELECT id, booking_id, host_id, client_id, dispute_reason, dispute_description,
		       dispute_status, resolution_type, opened_at, resolved_at, created_at
		FROM escrow.disputes WHERE id = $1
	`

	var dispute pb.Dispute
	var createdAtTime, openedAtTime time.Time
	var resolvedAtPtr *time.Time

	err := s.db.QueryRow(ctx, query, req.DisputeId).Scan(
		&dispute.Id, &dispute.BookingId, &dispute.HostId, &dispute.ClientId,
		&dispute.DisputeReason, &dispute.DisputeDescription, &dispute.DisputeStatus,
		&dispute.ResolutionType, &openedAtTime, &resolvedAtPtr, &createdAtTime,
	)

	if err != nil {
		return &pb.GetDisputeStatusResponse{
			Success:      false,
			ErrorMessage: errDisputeNotFound,
		}, status.Error(codes.NotFound, errDisputeNotFound)
	}

	dispute.CreatedAt = createdAtTime.Format(time.RFC3339)
	dispute.OpenedAt = openedAtTime.Format(time.RFC3339)
	if resolvedAtPtr != nil {
		dispute.ResolvedAt = resolvedAtPtr.Format(time.RFC3339)
	}

	return &pb.GetDisputeStatusResponse{
		Success: true,
		Dispute: &dispute,
	}, nil
}
