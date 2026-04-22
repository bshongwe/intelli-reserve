package main

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ============================================================================
// MODELS
// ============================================================================

// Payout represents a payout record from the database
type Payout struct {
	ID                    string
	HostID                string
	EscrowAccountID       string
	AmountCents           int64
	PayoutStatus          string
	BankAccountToken      string
	ExternalTransactionID *string // Nullable
	FailureReason         *string // Nullable
	RequestedAt           time.Time
	ProcessingStartedAt   *time.Time // Nullable
	CompletedAt           *time.Time // Nullable
	CreatedAt             time.Time
}

// EscrowTransaction represents an immutable audit log entry
type EscrowTransaction struct {
	ID              string
	EscrowAccountID string
	TransactionType string
	PayoutID        *string // Nullable
	HoldID          *string // Nullable
	AmountCents     int64
	BalanceBefore   int64
	BalanceAfter    int64
	CreatedAt       time.Time
}

// EscrowAccount represents host's escrow account
type EscrowAccount struct {
	ID               string
	HostID           string
	HeldBalance      int64
	AvailableBalance int64
	TotalReceived    int64
	TotalPaidOut     int64
	AccountStatus    string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// ============================================================================
// PAYOUT OPERATIONS
// ============================================================================

// CreatePayout atomically creates a payout record and logs the transaction
// This is Phase 1 of the payout process: Validation + Recording
// Returns (payoutID, error)
func CreatePayout(
	ctx context.Context,
	hostID string,
	escrowAccountID string,
	amountCents int64,
) (string, error) {
	payoutID := uuid.New().String()
	now := time.Now().UTC()

	// Start transaction - CRITICAL for atomicity (Principle 3)
	tx, err := dbPool.Begin(ctx)
	if err != nil {
		logger.Printf("Error starting transaction: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}
	defer tx.Rollback(ctx) // Rollback if not committed

	// 1. Get current balance (for audit log)
	var currentBalance int64
	err = tx.QueryRow(ctx, fmt.Sprintf(`
		SELECT available_balance
		FROM %s.%s
		WHERE id = $1
		FOR UPDATE -- Lock row for this transaction
	`, EscrowSchema, EscrowAccountsTable), escrowAccountID).Scan(&currentBalance)

	if err != nil {
		logger.Printf("Error fetching balance: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}

	// 2. Insert payout record (status = pending)
	_, err = tx.Exec(ctx, fmt.Sprintf(`
		INSERT INTO %s.%s (
			id, host_id, escrow_account_id, amount_cents,
			payout_status, requested_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, EscrowSchema, PayoutsTable),
		payoutID,
		hostID,
		escrowAccountID,
		amountCents,
		PayoutStatusPending,
		now,
		now,
	)

	if err != nil {
		logger.Printf("Error inserting payout: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}

	// 3. Update available balance (deduct payout amount)
	newBalance := currentBalance - amountCents
	_, err = tx.Exec(ctx, fmt.Sprintf(`
		UPDATE %s.%s
		SET available_balance = $1, updated_at = $2
		WHERE id = $3
	`, EscrowSchema, EscrowAccountsTable),
		newBalance,
		now,
		escrowAccountID,
	)

	if err != nil {
		logger.Printf("Error updating balance: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}

	// 4. Create audit log entry (immutable - INSERT only, never UPDATE)
	_, err = tx.Exec(ctx, fmt.Sprintf(`
		INSERT INTO %s.%s (
			id, escrow_account_id, transaction_type,
			payout_id, amount_cents,
			balance_before, balance_after, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, EscrowSchema, EscrowTransactionsTable),
		uuid.New().String(),
		escrowAccountID,
		TransactionTypePayoutInitiated,
		payoutID,
		amountCents,
		currentBalance,
		newBalance,
		now,
	)

	if err != nil {
		logger.Printf("Error creating transaction log: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}

	// Commit transaction - all or nothing (atomic)
	if err := tx.Commit(ctx); err != nil {
		logger.Printf("Error committing transaction: %v", err)
		return "", fmt.Errorf(ErrDatabaseTransaction)
	}

	logger.Printf("✓ Payout created: %s (amount: %d cents, account: %s)", payoutID, amountCents, escrowAccountID)
	return payoutID, nil
}

// GetPayoutByID retrieves a specific payout
func GetPayoutByID(ctx context.Context, payoutID string) (*Payout, error) {
	if payoutID == "" {
		return nil, fmt.Errorf(ErrPayoutIDMissing)
	}

	payout := &Payout{}

	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT
			id, host_id, escrow_account_id, amount_cents,
			payout_status, bank_account_token,
			external_transaction_id, failure_reason,
			requested_at, processing_started_at, completed_at,
			created_at
		FROM %s.%s
		WHERE id = $1
	`, EscrowSchema, PayoutsTable), payoutID).Scan(
		&payout.ID,
		&payout.HostID,
		&payout.EscrowAccountID,
		&payout.AmountCents,
		&payout.PayoutStatus,
		&payout.BankAccountToken,
		&payout.ExternalTransactionID,
		&payout.FailureReason,
		&payout.RequestedAt,
		&payout.ProcessingStartedAt,
		&payout.CompletedAt,
		&payout.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf(ErrPayoutNotFound)
	}

	if err != nil {
		logger.Printf("Error fetching payout: %v", err)
		return nil, fmt.Errorf(ErrDatabaseTransaction)
	}

	return payout, nil
}

// UpdatePayoutStatus updates payout status and optionally the external transaction ID
// Used for Phase 2: Processing and completion
func UpdatePayoutStatus(
	ctx context.Context,
	payoutID string,
	newStatus string,
	externalTransactionID *string,
	failureReason *string,
) error {
	if payoutID == "" {
		return fmt.Errorf(ErrPayoutIDMissing)
	}

	// Validate status (Principle 3: validate constraints)
	validStatuses := map[string]bool{
		PayoutStatusPending:    true,
		PayoutStatusProcessing: true,
		PayoutStatusCompleted:  true,
		PayoutStatusFailed:     true,
	}
	if !validStatuses[newStatus] {
		return fmt.Errorf("invalid payout status: %s", newStatus)
	}

	now := time.Now().UTC()

	// Build dynamic query based on which fields are provided
	var updateCols []interface{}
	query := fmt.Sprintf("UPDATE %s.%s SET payout_status = $1", EscrowSchema, PayoutsTable)
	paramCount := 2

	updateCols = append(updateCols, newStatus)

	if newStatus == PayoutStatusProcessing {
		query += fmt.Sprintf(", processing_started_at = $%d", paramCount)
		updateCols = append(updateCols, now)
		paramCount++
	}

	if newStatus == PayoutStatusCompleted {
		query += fmt.Sprintf(", completed_at = $%d", paramCount)
		updateCols = append(updateCols, now)
		paramCount++
	}

	if externalTransactionID != nil {
		query += fmt.Sprintf(", external_transaction_id = $%d", paramCount)
		updateCols = append(updateCols, *externalTransactionID)
		paramCount++
	}

	if failureReason != nil {
		query += fmt.Sprintf(", failure_reason = $%d", paramCount)
		updateCols = append(updateCols, *failureReason)
		paramCount++
	}

	query += fmt.Sprintf(" WHERE id = $%d", paramCount)
	updateCols = append(updateCols, payoutID)

	_, err := dbPool.Exec(ctx, query, updateCols...)
	if err != nil {
		logger.Printf("Error updating payout status: %v", err)
		return fmt.Errorf(ErrDatabaseTransaction)
	}

	logger.Printf("✓ Payout status updated: %s → %s", payoutID, newStatus)
	return nil
}

// GetPayoutsByHostID retrieves all payouts for a host with pagination
func GetPayoutsByHostID(ctx context.Context, hostID string, limit, offset int32) ([]*Payout, int64, error) {
	if hostID == "" {
		return nil, 0, fmt.Errorf(ErrHostIDMissing)
	}

	// Validate pagination
	limit, offset, _ = ValidatePaginationParams(limit, offset)

	// Get total count
	var totalCount int64
	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.%s
		WHERE host_id = $1
	`, EscrowSchema, PayoutsTable), hostID).Scan(&totalCount)

	if err != nil {
		logger.Printf("Error counting payouts: %v", err)
		return nil, 0, fmt.Errorf(ErrDatabaseTransaction)
	}

	// Get paginated results
	rows, err := dbPool.Query(ctx, fmt.Sprintf(`
		SELECT
			id, host_id, escrow_account_id, amount_cents,
			payout_status, bank_account_token,
			external_transaction_id, failure_reason,
			requested_at, processing_started_at, completed_at,
			created_at
		FROM %s.%s
		WHERE host_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, EscrowSchema, PayoutsTable), hostID, limit, offset)

	if err != nil {
		logger.Printf("Error querying payouts: %v", err)
		return nil, 0, fmt.Errorf(ErrDatabaseTransaction)
	}
	defer rows.Close()

	payouts := []*Payout{}
	for rows.Next() {
		payout := &Payout{}
		err := rows.Scan(
			&payout.ID,
			&payout.HostID,
			&payout.EscrowAccountID,
			&payout.AmountCents,
			&payout.PayoutStatus,
			&payout.BankAccountToken,
			&payout.ExternalTransactionID,
			&payout.FailureReason,
			&payout.RequestedAt,
			&payout.ProcessingStartedAt,
			&payout.CompletedAt,
			&payout.CreatedAt,
		)
		if err != nil {
			logger.Printf("Error scanning payout: %v", err)
			continue
		}
		payouts = append(payouts, payout)
	}

	return payouts, totalCount, nil
}

// ============================================================================
// TRANSACTION HISTORY OPERATIONS
// ============================================================================

// GetTransactionHistoryByHostID retrieves audit trail for a host's account
// Used to reconstruct state or investigate discrepancies
func GetTransactionHistoryByHostID(ctx context.Context, hostID string, limit, offset int32) ([]*EscrowTransaction, int64, error) {
	if hostID == "" {
		return nil, 0, fmt.Errorf(ErrHostIDMissing)
	}

	// Validate pagination
	limit, offset, _ = ValidatePaginationParams(limit, offset)

	// Get escrow account ID first (FK relationship)
	var accountID string
	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT id FROM %s.%s WHERE host_id = $1
	`, EscrowSchema, EscrowAccountsTable), hostID).Scan(&accountID)

	if err == pgx.ErrNoRows {
		return []*EscrowTransaction{}, 0, nil
	}

	if err != nil {
		logger.Printf("Error finding escrow account: %v", err)
		return nil, 0, fmt.Errorf(ErrDatabaseTransaction)
	}

	// Get total count
	var totalCount int64
	err = dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.%s
		WHERE escrow_account_id = $1
	`, EscrowSchema, EscrowTransactionsTable), accountID).Scan(&totalCount)

	if err != nil {
		logger.Printf("Error counting transactions: %v", err)
		return nil, 0, fmt.Errorf(ErrDatabaseTransaction)
	}

	// Get paginated results (IMMUTABLE - never updated)
	rows, err := dbPool.Query(ctx, fmt.Sprintf(`
		SELECT
			id, escrow_account_id, transaction_type,
			payout_id, hold_id, amount_cents,
			balance_before, balance_after, created_at
		FROM %s.%s
		WHERE escrow_account_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, EscrowSchema, EscrowTransactionsTable), accountID, limit, offset)

	if err != nil {
		logger.Printf("Error querying transactions: %v", err)
		return nil, 0, fmt.Errorf(ErrDatabaseTransaction)
	}
	defer rows.Close()

	transactions := []*EscrowTransaction{}
	for rows.Next() {
		tx := &EscrowTransaction{}
		err := rows.Scan(
			&tx.ID,
			&tx.EscrowAccountID,
			&tx.TransactionType,
			&tx.PayoutID,
			&tx.HoldID,
			&tx.AmountCents,
			&tx.BalanceBefore,
			&tx.BalanceAfter,
			&tx.CreatedAt,
		)
		if err != nil {
			logger.Printf("Error scanning transaction: %v", err)
			continue
		}
		transactions = append(transactions, tx)
	}

	return transactions, totalCount, nil
}

// ============================================================================
// ESCROW ACCOUNT OPERATIONS
// ============================================================================

// GetEscrowAccountByHostID retrieves host's escrow account
func GetEscrowAccountByHostID(ctx context.Context, hostID string) (*EscrowAccount, error) {
	if hostID == "" {
		return nil, fmt.Errorf(ErrHostIDMissing)
	}

	account := &EscrowAccount{}

	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT
			id, host_id, held_balance, available_balance,
			total_received, total_paid_out, account_status,
			created_at, updated_at
		FROM %s.%s
		WHERE host_id = $1
	`, EscrowSchema, EscrowAccountsTable), hostID).Scan(
		&account.ID,
		&account.HostID,
		&account.HeldBalance,
		&account.AvailableBalance,
		&account.TotalReceived,
		&account.TotalPaidOut,
		&account.AccountStatus,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf(ErrAccountNotFound)
	}

	if err != nil {
		logger.Printf("Error fetching escrow account: %v", err)
		return nil, fmt.Errorf(ErrDatabaseTransaction)
	}

	return account, nil
}

// GetAvailableBalance retrieves available balance for a host
func GetAvailableBalance(ctx context.Context, hostID string) (int64, error) {
	if hostID == "" {
		return 0, fmt.Errorf(ErrHostIDMissing)
	}

	var balance int64

	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT available_balance
		FROM %s.%s
		WHERE host_id = $1
	`, EscrowSchema, EscrowAccountsTable), hostID).Scan(&balance)

	if err == pgx.ErrNoRows {
		return 0, fmt.Errorf(ErrAccountNotFound)
	}

	if err != nil {
		logger.Printf("Error fetching available balance: %v", err)
		return 0, fmt.Errorf(ErrDatabaseTransaction)
	}

	return balance, nil
}
