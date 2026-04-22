package main

// ============================================================================
// SERVICE METADATA
// ============================================================================

const (
	ServiceName    = "payout-service"
	ServiceVersion = "1.0.0"
	HTTPPort       = ":8087" // Health check port
	GRPCPort       = ":8097" // gRPC service port
)

// ============================================================================
// PAYOUT STATUS
// ============================================================================

const (
	PayoutStatusPending    = "pending"
	PayoutStatusProcessing = "processing"
	PayoutStatusCompleted  = "completed"
	PayoutStatusFailed     = "failed"
)

// ============================================================================
// ACCOUNT STATUS
// ============================================================================

const (
	AccountStatusActive    = "active"
	AccountStatusSuspended = "suspended"
	AccountStatusClosed    = "closed"
)

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

const (
	TransactionTypePayoutInitiated   = "payout_initiated"
	TransactionTypePayoutProcessing  = "payout_processing"
	TransactionTypePayoutCompleted   = "payout_completed"
	TransactionTypePayoutFailed      = "payout_failed"
	TransactionTypeBalanceRestored   = "balance_restored"
)

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const (
	ErrInsufficientBalance       = "insufficient available balance for payout"
	ErrInvalidAmount             = "amount must be greater than zero"
	ErrAccountNotFound           = "escrow account not found"
	ErrAccountSuspended          = "account is suspended"
	ErrAccountClosed             = "account is closed"
	ErrAccountUnderDispute       = "account is under dispute"
	ErrPayoutAlreadyProcessing   = "payout is already being processed"
	ErrPayoutNotFound            = "payout not found"
	ErrPayoutAlreadyCompleted    = "payout is already completed"
	ErrDatabaseTransaction        = "database transaction failed"
	ErrInvalidBankAccountToken   = "invalid bank account token format"
	ErrPayoutIDMissing           = "payout ID is required"
	ErrHostIDMissing             = "host ID is required"
	ErrRequestNil                = "request cannot be nil"
	ErrDatabaseError             = "Database error: %v"
	ErrUnimplementedHoldOps      = "use escrow-service for hold operations"
	ErrUnimplementedDisputeOps   = "use escrow-service for dispute operations"
)

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

const (
	MsgPayoutRequested            = "Payout request accepted and queued for processing"
	MsgPayoutStatus               = "Payout status retrieved successfully"
	MsgPayoutHistory              = "Payout history retrieved successfully"
	MsgTransactionHistory         = "Transaction history retrieved successfully"
	MsgPayoutProcessingStarted    = "Payout processing started"
	MsgPayoutCompleted            = "Payout completed successfully"
	MsgPayoutFailed               = "Payout processing failed"
)

// ============================================================================
// VALIDATION CONSTRAINTS
// ============================================================================

const (
	MinPayoutAmountCents = 100         // 1 ZAR
	MaxPayoutAmountCents = 5000000     // 50,000 ZAR
	DefaultPageSize      = 20
	MaxPageSize          = 100
)

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const (
	EscrowSchema = "escrow"
	// Tables
	PayoutsTable           = "payouts"
	EscrowAccountsTable    = "escrow_accounts"
	EscrowTransactionsTable = "escrow_transactions"
	DisputesTable          = "disputes"
)

// ============================================================================
// PAYFAST INTEGRATION
// ============================================================================

const (
	PayFastMerchantId = "PAYFAST_MERCHANT_ID"
	PayFastMerchantKey = "PAYFAST_MERCHANT_KEY"
	PayFastAPI = "https://api.payfast.co.za/subscriptions"
	PayFastSandboxAPI = "https://sandbox.payfast.co.za/subscriptions"
)
