package main

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// ============================================================================
// PAYFAST INTEGRATION
// ============================================================================

// PayFastClient handles all PayFast API interactions
type PayFastClient struct {
	merchantID string
	merchantKey string
	baseURL    string
	httpClient *http.Client
}

// PayFastPayoutRequest represents a payout request to PayFast
type PayFastPayoutRequest struct {
	MerchantID        string // Unique merchant ID
	MerchantRef       string // Reference (our payoutID)
	Amount            string // Amount in ZAR (e.g., "500.00")
	NameFirst         string // Host first name
	NameLast          string // Host last name
	EmailAddress      string // Host email
	CellNumber        string // Host phone (optional)
	BankAccountHolder string // Account holder name
	BankAccountType   string // "checking" or "savings"
	BankAccountNumber string // Account number
	BankBranchCode    string // Branch code
	Signature         string // MD5 hash for security
}

// PayFastPayoutResponse represents response from PayFast
type PayFastPayoutResponse struct {
	Status     string `json:"status"`
	Reference  string `json:"reference"`
	Amount     string `json:"amount"`
	Message    string `json:"message"`
	Timestamp  string `json:"timestamp"`
	ErrorCode  string `json:"error_code,omitempty"`
	ErrorMsg   string `json:"error_msg,omitempty"`
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// NewPayFastClient creates a new PayFast client
func NewPayFastClient(merchantID, merchantKey string, sandbox bool) *PayFastClient {
	baseURL := "https://api.payfast.co.za/subscriptions"
	if sandbox {
		baseURL = "https://sandbox.payfast.co.za/subscriptions"
	}

	return &PayFastClient{
		merchantID: merchantID,
		merchantKey: merchantKey,
		baseURL:    baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ============================================================================
// REQUEST SIGNING
// ============================================================================

// GenerateSignature creates MD5 hash for PayFast verification
// PayFast requires: MD5(merchant_id&merchant_key)
func (c *PayFastClient) GenerateSignature() string {
	data := fmt.Sprintf("%s&%s", c.merchantID, c.merchantKey)
	hash := md5.Sum([]byte(data))
	return fmt.Sprintf("%x", hash)
}

// GeneratePayoutSignature creates signature for payout request
// Format: merchant_id&amount&reference&...&merchant_key
func (c *PayFastClient) GeneratePayoutSignature(params map[string]string) string {
	// Create sorted list of keys (required for PayFast)
	var keys []string
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build signature string
	var parts []string
	for _, k := range keys {
		parts = append(parts, params[k])
	}

	// Append merchant key
	signatureStr := strings.Join(parts, "&") + "&" + c.merchantKey

	// Calculate MD5
	hash := md5.Sum([]byte(signatureStr))
	return fmt.Sprintf("%x", hash)
}

// ============================================================================
// PAYOUT PROCESSING
// ============================================================================

// RequestPayout sends a payout request to PayFast
// Called in Phase 2 after payout record is created
// Returns (externalTransactionID, error)
func (c *PayFastClient) RequestPayout(
	ctx context.Context,
	payoutID string,
	hostID string,
	amountCents int64,
	bankAccountToken string,
	hostEmail string,
) (string, error) {

	logger.Printf("PayFast: Requesting payout for %s (amount: %d cents)", payoutID, amountCents)

	// Validate inputs
	if payoutID == "" {
		return "", fmt.Errorf("payoutID is required")
	}

	if amountCents <= 0 {
		return "", fmt.Errorf("amount must be positive")
	}

	if bankAccountToken == "" {
		return "", fmt.Errorf("bankAccountToken is required")
	}

	// Convert cents to ZAR string (e.g., 50000 → "500.00")
	amountZAR := fmt.Sprintf("%.2f", float64(amountCents)/100.0)

	// Build PayFast payout request parameters
	// Note: Bank account details come from bankAccountToken (encrypted/tokenized)
	// In production, user details (name, email) would be fetched via BFF layer
	params := map[string]string{
		"merchant_id":          c.merchantID,
		"merchant_ref":         payoutID,
		"amount":               amountZAR,
		"name_first":           "Host",          // From BFF (user profile)
		"name_last":            hostID,          // Fallback to ID if name unavailable
		"email_address":        hostEmail,       // From BFF (user email)
		"bank_account_holder":  "Host Account",  // From bankAccountToken metadata
		"bank_account_type":    "checking",      // Default type
		"bank_account_number":  bankAccountToken, // Tokenized/encrypted account
		"bank_branch_code":     "632005",        // Generic South African code
		"cell_number":          "",              // Optional
	}

	// Generate signature
	signature := c.GeneratePayoutSignature(params)
	params["signature"] = signature

	// Create form data
	formData := url.Values{}
	for k, v := range params {
		formData.Set(k, v)
	}

	// Make HTTP request with timeout
	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "POST", c.baseURL, strings.NewReader(formData.Encode()))
	if err != nil {
		logger.Printf("PayFast: Error creating request: %v", err)
		return "", fmt.Errorf("failed to create PayFast request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("User-Agent", "IntelliReserve/1.0")

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Printf("PayFast: HTTP error: %v", err)
		return "", fmt.Errorf("PayFast API request failed: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Printf("PayFast: Error reading response: %v", err)
		return "", fmt.Errorf("failed to read PayFast response: %v", err)
	}

	// Parse response
	var payoutResp PayFastPayoutResponse
	if err := json.Unmarshal(body, &payoutResp); err != nil {
		logger.Printf("PayFast: Error parsing response: %v (body: %s)", err, string(body))
		return "", fmt.Errorf("invalid PayFast response format: %v", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		logger.Printf("PayFast: HTTP %d - %s", resp.StatusCode, payoutResp.ErrorMsg)
		return "", fmt.Errorf("PayFast API error: %s (%s)", payoutResp.ErrorMsg, payoutResp.ErrorCode)
	}

	// Verify response contains reference
	if payoutResp.Reference == "" {
		logger.Printf("PayFast: No reference in response")
		return "", fmt.Errorf("PayFast response missing reference")
	}

	logger.Printf("✓ PayFast: Payout initiated - Reference: %s", payoutResp.Reference)
	return payoutResp.Reference, nil
}

// ============================================================================
// STATUS POLLING (For testing/fallback)
// ============================================================================

// PollPayoutStatus checks the status of a payout at PayFast
// Used for tracking pending payouts
// Returns (status, error)
func (c *PayFastClient) PollPayoutStatus(
	ctx context.Context,
	externalTransactionID string,
) (string, error) {

	if externalTransactionID == "" {
		return "", fmt.Errorf("externalTransactionID is required")
	}

	logger.Printf("PayFast: Polling status for %s", externalTransactionID)

	// Build request
	params := map[string]string{
		"merchant_id":  c.merchantID,
		"reference":    externalTransactionID,
	}

	// Generate signature
	signature := c.GeneratePayoutSignature(params)
	params["signature"] = signature

	// Create form data
	formData := url.Values{}
	for k, v := range params {
		formData.Set(k, v)
	}

	// Make request
	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Status endpoint
	statusURL := c.baseURL + "/check_status"

	req, err := http.NewRequestWithContext(reqCtx, "POST", statusURL, strings.NewReader(formData.Encode()))
	if err != nil {
		logger.Printf("PayFast: Error creating status request: %v", err)
		return "", fmt.Errorf("failed to create status request: %v", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Printf("PayFast: Status polling error: %v", err)
		return "", fmt.Errorf("status polling failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Printf("PayFast: Error reading status response: %v", err)
		return "", fmt.Errorf("failed to read status response: %v", err)
	}

	var statusResp PayFastPayoutResponse
	if err := json.Unmarshal(body, &statusResp); err != nil {
		logger.Printf("PayFast: Error parsing status response: %v", err)
		return "", fmt.Errorf("invalid status response format: %v", err)
	}

	logger.Printf("PayFast: Status = %s", statusResp.Status)
	return statusResp.Status, nil
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

// VerifyWebhookSignature validates PayFast webhook signature
// Called when PayFast sends completion notification
func (c *PayFastClient) VerifyWebhookSignature(data map[string]string, signature string) bool {
	// Create sorted parameter list
	var keys []string
	for k := range data {
		if k != "signature" && k != "custom_str1" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	// Build signature string
	var parts []string
	for _, k := range keys {
		parts = append(parts, data[k])
	}

	signatureStr := strings.Join(parts, "&") + "&" + c.merchantKey

	// Calculate expected hash
	hash := md5.Sum([]byte(signatureStr))
	expectedSig := fmt.Sprintf("%x", hash)

	// Compare signatures
	isValid := expectedSig == signature
	if !isValid {
		logger.Printf("PayFast: Signature mismatch - expected %s, got %s", expectedSig, signature)
	}

	return isValid
}

// ============================================================================
// ERROR HANDLING & RETRIES
// ============================================================================

// RetryableError checks if an error is retryable
func (c *PayFastClient) IsRetryableError(err error) bool {
	errStr := err.Error()

	// Retryable errors
	retryablePatterns := []string{
		"timeout",
		"connection refused",
		"connection reset",
		"i/o timeout",
		"temporary failure",
	}

	for _, pattern := range retryablePatterns {
		if strings.Contains(strings.ToLower(errStr), pattern) {
			return true
		}
	}

	return false
}

// RequestPayoutWithRetry attempts payout with exponential backoff
// Max retries: 3
func (c *PayFastClient) RequestPayoutWithRetry(
	ctx context.Context,
	payoutID string,
	hostID string,
	amountCents int64,
	bankAccountToken string,
	hostEmail string,
) (string, error) {

	maxRetries := 3
	baseDelay := 1 * time.Second

	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Exponential backoff: 1s, 2s, 4s
		if attempt > 0 {
			delay := time.Duration((1 << uint(attempt-1))) * baseDelay
			logger.Printf("PayFast: Retry attempt %d after %v", attempt+1, delay)
			time.Sleep(delay)
		}

		// Try payout
		ref, err := c.RequestPayout(ctx, payoutID, hostID, amountCents, bankAccountToken, hostEmail)
		if err == nil {
			return ref, nil
		}

		lastErr = err

		// Check if retryable
		if !c.IsRetryableError(err) {
			logger.Printf("PayFast: Non-retryable error: %v", err)
			return "", err
		}

		logger.Printf("PayFast: Attempt %d failed: %v", attempt+1, err)
	}

	logger.Printf("PayFast: All %d retry attempts exhausted", maxRetries)
	return "", fmt.Errorf("PayFast request failed after %d attempts: %v", maxRetries, lastErr)
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

// HealthCheck verifies PayFast API connectivity
func (c *PayFastClient) HealthCheck(ctx context.Context) bool {
	logger.Printf("PayFast: Running health check...")

	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", c.baseURL, nil)
	if err != nil {
		logger.Printf("PayFast: Health check error: %v", err)
		return false
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Printf("PayFast: Health check failed: %v", err)
		return false
	}
	defer resp.Body.Close()

	isHealthy := resp.StatusCode < 500
	if isHealthy {
		logger.Printf("✓ PayFast: Health check passed")
	} else {
		logger.Printf("✗ PayFast: Health check failed (HTTP %d)", resp.StatusCode)
	}

	return isHealthy
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

// LogPayoutRequest logs details of a payout request (sanitized)
func LogPayoutRequest(payoutID string, amount int64, email string) {
	amountZAR := float64(amount) / 100.0
	logger.Printf("PayFast: RequestPayout - ID: %s, Amount: R%.2f, Email: %s", payoutID, amountZAR, email)
}

// LogPayoutSuccess logs successful payout
func LogPayoutSuccess(payoutID string, externalRef string) {
	logger.Printf("✓ PayFast: Payout successful - Internal: %s, External: %s", payoutID, externalRef)
}

// LogPayoutFailure logs failed payout with reason
func LogPayoutFailure(payoutID string, reason string) {
	logger.Printf("✗ PayFast: Payout failed - ID: %s, Reason: %s", payoutID, reason)
}
