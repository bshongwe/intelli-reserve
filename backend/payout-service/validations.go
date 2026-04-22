package main

import (
	"context"
	"fmt"
	"regexp"
)

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

// ValidatePayoutRequest validates a payout request before processing
func ValidatePayoutRequest(ctx context.Context, hostID string, amountCents int64) error {
	// Validate hostID is not empty
	if hostID == "" {
		return fmt.Errorf(ErrHostIDMissing)
	}

	// Validate amountCents is in valid range
	if amountCents <= 0 {
		return fmt.Errorf(ErrInvalidAmount)
	}

	if amountCents < MinPayoutAmountCents {
		return fmt.Errorf("amount must be at least %d cents", MinPayoutAmountCents)
	}

	if amountCents > MaxPayoutAmountCents {
		return fmt.Errorf("amount cannot exceed %d cents", MaxPayoutAmountCents)
	}

	return nil
}

// ValidateHostExists checks if a host exists in the system
// Returns (exists, isActive, error)
func ValidateHostExists(ctx context.Context, hostID string) (bool, error) {
	if hostID == "" {
		return false, fmt.Errorf(ErrHostIDMissing)
	}

	// Query the database to check if user/host exists
	var exists bool
	err := dbPool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)
	`, hostID).Scan(&exists)

	if err != nil {
		logger.Printf("Error checking if host exists: %v", err)
		return false, fmt.Errorf(ErrDatabaseTransaction)
	}

	return exists, nil
}

// ValidateEscrowAccount checks if host has an active escrow account
// Returns (accountID, exists, isActive, error)
func ValidateEscrowAccount(ctx context.Context, hostID string) (string, bool, bool, error) {
	if hostID == "" {
		return "", false, false, fmt.Errorf(ErrHostIDMissing)
	}

	var accountID string
	var status string

	// Query for escrow account
	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT id, account_status
		FROM %s.%s
		WHERE host_id = $1
		LIMIT 1
	`, EscrowSchema, EscrowAccountsTable), hostID).Scan(&accountID, &status)

	if err != nil {
		// No account found
		return "", false, false, nil
	}

	// Check if account is active
	isActive := status == AccountStatusActive

	return accountID, true, isActive, nil
}

// ValidateSufficientBalance checks if host has sufficient available balance
// Returns (available_balance, has_sufficient, error)
func ValidateSufficientBalance(ctx context.Context, escrowAccountID string, requestedAmountCents int64) (int64, bool, error) {
	if escrowAccountID == "" {
		return 0, false, fmt.Errorf("escrow account ID is required")
	}

	if requestedAmountCents <= 0 {
		return 0, false, fmt.Errorf(ErrInvalidAmount)
	}

	var availableBalance int64
	var accountStatus string

	// Query for available balance and account status
	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT available_balance, account_status
		FROM %s.%s
		WHERE id = $1
	`, EscrowSchema, EscrowAccountsTable), escrowAccountID).Scan(&availableBalance, &accountStatus)

	if err != nil {
		logger.Printf("Error querying balance: %v", err)
		return 0, false, fmt.Errorf(ErrDatabaseTransaction)
	}

	// Check account status
	if accountStatus == AccountStatusSuspended {
		return availableBalance, false, fmt.Errorf(ErrAccountSuspended)
	}

	if accountStatus == AccountStatusClosed {
		return availableBalance, false, fmt.Errorf(ErrAccountClosed)
	}

	// Check if balance is sufficient
	hasSufficient := availableBalance >= requestedAmountCents

	return availableBalance, hasSufficient, nil
}

// ValidateNoActiveDispute checks if account is under dispute
func ValidateNoActiveDispute(ctx context.Context, escrowAccountID string) (bool, error) {
	if escrowAccountID == "" {
		return false, fmt.Errorf("escrow account ID is required")
	}

	var hasDispute bool

	// Query for active disputes
	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT EXISTS(
			SELECT 1 FROM %s.%s
			WHERE escrow_account_id = $1
			AND dispute_status NOT IN ('resolved', 'closed')
		)
	`, EscrowSchema, DisputesTable), escrowAccountID).Scan(&hasDispute)

	if err != nil {
		logger.Printf("Error checking disputes: %v", err)
		return false, fmt.Errorf(ErrDatabaseTransaction)
	}

	return !hasDispute, nil
}

// ValidatePayoutExists checks if a payout exists and returns its status
// Returns (status, exists, error)
func ValidatePayoutExists(ctx context.Context, payoutID string) (string, bool, error) {
	if payoutID == "" {
		return "", false, fmt.Errorf(ErrPayoutIDMissing)
	}

	var status string

	err := dbPool.QueryRow(ctx, fmt.Sprintf(`
		SELECT payout_status
		FROM %s.%s
		WHERE id = $1
	`, EscrowSchema, PayoutsTable), payoutID).Scan(&status)

	if err != nil {
		// Payout not found
		return "", false, nil
	}

	return status, true, nil
}

// ValidatePaginationParams validates limit and offset parameters
func ValidatePaginationParams(limit, offset int32) (int32, int32, error) {
	// Set defaults
	if limit <= 0 {
		limit = DefaultPageSize
	}

	// Cap maximum page size
	if limit > MaxPageSize {
		limit = MaxPageSize
	}

	if offset < 0 {
		offset = 0
	}

	return limit, offset, nil
}

// ValidateUUID checks if a string is a valid UUID format
func ValidateUUID(id string) bool {
	// Simple UUID v4 validation pattern
	// Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	uuidPattern := regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`)
	return uuidPattern.MatchString(id)
}

// ============================================================================
// BATCH VALIDATION FUNCTIONS
// ============================================================================

// ValidatePayoutRequestComplete performs all validations for a payout request
// Returns (escrowAccountID, error) on success
func ValidatePayoutRequestComplete(
	ctx context.Context,
	hostID string,
	amountCents int64,
) (string, error) {
	// 1. Validate request parameters
	if err := ValidatePayoutRequest(ctx, hostID, amountCents); err != nil {
		return "", err
	}

	// 2. Validate host exists
	exists, err := ValidateHostExists(ctx, hostID)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", fmt.Errorf(ErrAccountNotFound)
	}

	// 3. Validate escrow account exists and is active
	accountID, accountExists, isActive, err := ValidateEscrowAccount(ctx, hostID)
	if err != nil {
		return "", err
	}
	if !accountExists {
		return "", fmt.Errorf(ErrAccountNotFound)
	}
	if !isActive {
		return "", fmt.Errorf(ErrAccountSuspended)
	}

	// 4. Validate sufficient balance
	_, hasSufficient, err := ValidateSufficientBalance(ctx, accountID, amountCents)
	if err != nil {
		return "", err
	}
	if !hasSufficient {
		return "", fmt.Errorf(ErrInsufficientBalance)
	}

	// 5. Validate no active disputes
	noDispute, err := ValidateNoActiveDispute(ctx, accountID)
	if err != nil {
		return "", err
	}
	if !noDispute {
		return "", fmt.Errorf(ErrAccountUnderDispute)
	}

	return accountID, nil
}
