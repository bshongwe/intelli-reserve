package main

import (
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

const (
	contentTypeHeader   = "Content-Type"
	contentTypeFormURL  = "application/x-www-form-urlencoded"
	errRefIDRequired    = "reference ID is required"
	errMissingFields    = "missing required fields: email or token"
	logPaymentCreated   = "✅ Payment hold created on PayFast: %s"
	logPaymentReleased  = "✅ Payment hold released: %s"
	logPaymentRefunded  = "✅ Payment refunded: %s"
)

// PaymentGatewayClient interface defines payment operations
type PaymentGatewayClient interface {
	CreatePaymentHold(req *CreatePaymentHoldRequest) (*CreatePaymentHoldResponse, error)
	ReleasePaymentHold(referenceID string, amount int64) error
	RefundPayment(referenceID string, amount int64) error
	CheckPaymentStatus(referenceID string) (*PaymentStatusResponse, error)
}

// CreatePaymentHoldRequest represents a payment hold creation request
type CreatePaymentHoldRequest struct {
	Amount           int64  // in cents
	Description      string
	CustomerID       string
	CustomerEmail    string
	BankAccountToken string
}

// CreatePaymentHoldResponse represents the response from creating a payment hold
type CreatePaymentHoldResponse struct {
	ReferenceID string
	Status      string
	Amount      int64
	Timestamp   string
	Message     string
}

// PaymentStatusResponse represents payment status information
type PaymentStatusResponse struct {
	ReferenceID string
	Status      string
	Amount      int64
	CreatedAt   string
	UpdatedAt   string
}

// PayFastClient implements PaymentGatewayClient for PayFast payment processor
type PayFastClient struct {
	MerchantID   string
	MerchantKey  string
	APIBase      string
	HTTPClient   *http.Client
	RetryCount   int
	RetryBackoff time.Duration
}

// NewPayFastClient creates a new PayFast client
func NewPayFastClient(merchantID, merchantKey, apiBase string) *PayFastClient {
	return &PayFastClient{
		MerchantID:   merchantID,
		MerchantKey:  merchantKey,
		APIBase:      apiBase,
		HTTPClient:   &http.Client{Timeout: 30 * time.Second},
		RetryCount:   3,
		RetryBackoff: 2 * time.Second,
	}
}

// CreatePaymentHold creates a hold on customer's payment method
func (c *PayFastClient) CreatePaymentHold(req *CreatePaymentHoldRequest) (*CreatePaymentHoldResponse, error) {
	if req.Amount <= 0 {
		return nil, fmt.Errorf("%s: %d", errInvalidAmount, req.Amount)
	}

	if req.CustomerEmail == "" || req.BankAccountToken == "" {
		return nil, fmt.Errorf(errMissingFields)
	}

	// For production, use onsite payment processing
	// For development/testing, we'll validate the request and record it
	return c.createHoldWithRetry(req)
}

// createHoldWithRetry attempts to create a payment hold with retry logic
func (c *PayFastClient) createHoldWithRetry(req *CreatePaymentHoldRequest) (*CreatePaymentHoldResponse, error) {
	var lastErr error

	for attempt := 0; attempt < c.RetryCount; attempt++ {
		if attempt > 0 {
			time.Sleep(c.RetryBackoff * time.Duration(attempt))
			fmt.Printf("🔄 Retrying payment hold creation (attempt %d/%d)\n", attempt+1, c.RetryCount)
		}

		resp, err := c.executeCreateHold(req)
		if err == nil {
			return resp, nil
		}

		lastErr = err
	}

	return nil, fmt.Errorf("failed to create payment hold after %d attempts: %w", c.RetryCount, lastErr)
}

// executeCreateHold performs the actual API call to create a hold
func (c *PayFastClient) executeCreateHold(req *CreatePaymentHoldRequest) (*CreatePaymentHoldResponse, error) {
	// Build payload for PayFast
	payload := map[string]interface{}{
		"merchant_id":  c.MerchantID,
		"amount":       fmt.Sprintf("%.2f", float64(req.Amount)/100), // Convert to decimal
		"item_name":    req.Description,
		"custom_str1":  req.CustomerID,
		"email_address": req.CustomerEmail,
		"token":        req.BankAccountToken,
		"return_url":   "https://intellireserve.com/payment/return",
		"notify_url":   "https://intellireserve.com/payment/notify",
	}

	// Sign request
	signature := c.generateSignature(payload)
	payload["signature"] = signature

	// Prepare request data
	formData := url.Values{}
	for k, v := range payload {
		formData.Set(k, fmt.Sprintf("%v", v))
	}

	// Create HTTP request
	httpReq, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/onsite/process", c.APIBase),
		strings.NewReader(formData.Encode()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set(contentTypeHeader, contentTypeFormURL)

	// Send request
	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	bodyBytes, _ := io.ReadAll(resp.Body)

	// Parse response
	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		// If JSON parsing fails, try form-encoded response
		return c.parseFormResponse(string(bodyBytes), req)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("payfast error (status %d): %v", resp.StatusCode, result)
	}

	// Extract payment ID from response
	paymentID := fmt.Sprintf("%v", result["m_payment_id"])
	if paymentID == "" || paymentID == "<nil>" {
		return nil, fmt.Errorf("no payment ID in response: %v", result)
	}

	return &CreatePaymentHoldResponse{
		ReferenceID: paymentID,
		Status:      "held",
		Amount:      req.Amount,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Message:     "Payment hold created successfully",
	}, nil
}

// parseFormResponse parses form-encoded response from PayFast
func (c *PayFastClient) parseFormResponse(body string, req *CreatePaymentHoldRequest) (*CreatePaymentHoldResponse, error) {
	// PayFast returns: m_payment_id=12345&payment_status=0
	params, err := url.ParseQuery(body)
	if err != nil {
		return nil, fmt.Errorf("invalid response format: %w", err)
	}

	paymentID := params.Get("m_payment_id")
	if paymentID == "" {
		return nil, fmt.Errorf("no payment ID in response")
	}

	return &CreatePaymentHoldResponse{
		ReferenceID: paymentID,
		Status:      "held",
		Amount:      req.Amount,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Message:     "Payment hold created successfully",
	}, nil
}

// ReleasePaymentHold releases/completes a held payment
func (c *PayFastClient) ReleasePaymentHold(referenceID string, amount int64) error {
	if referenceID == "" {
		return fmt.Errorf(errRefIDRequired)
	}

	payload := map[string]interface{}{
		"merchant_id": c.MerchantID,
		"m_payment_id": referenceID,
		"amount":      fmt.Sprintf("%.2f", float64(amount)/100),
	}

	signature := c.generateSignature(payload)
	payload["signature"] = signature

	// Convert to form data
	formData := url.Values{}
	for k, v := range payload {
		formData.Set(k, fmt.Sprintf("%v", v))
	}

	httpReq, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/onsite/complete", c.APIBase),
		strings.NewReader(formData.Encode()),
	)
	httpReq.Header.Set(contentTypeHeader, contentTypeFormURL)

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("release request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("payfast release failed with status %d", resp.StatusCode)
	}

	return nil
}

// RefundPayment refunds a previously processed payment
func (c *PayFastClient) RefundPayment(referenceID string, amount int64) error {
	if referenceID == "" {
		return fmt.Errorf(errRefIDRequired)
	}

	payload := map[string]interface{}{
		"merchant_id":  c.MerchantID,
		"m_payment_id": referenceID,
		"amount":       fmt.Sprintf("%.2f", float64(amount)/100),
		"type":         "refund",
	}

	signature := c.generateSignature(payload)
	payload["signature"] = signature

	formData := url.Values{}
	for k, v := range payload {
		formData.Set(k, fmt.Sprintf("%v", v))
	}

	httpReq, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/onsite/refund", c.APIBase),
		strings.NewReader(formData.Encode()),
	)
	httpReq.Header.Set(contentTypeHeader, contentTypeFormURL)

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("refund request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("payfast refund failed with status %d", resp.StatusCode)
	}

	return nil
}

// CheckPaymentStatus checks the status of a payment
func (c *PayFastClient) CheckPaymentStatus(referenceID string) (*PaymentStatusResponse, error) {
	if referenceID == "" {
		return nil, fmt.Errorf(errRefIDRequired)
	}

	payload := map[string]interface{}{
		"merchant_id":  c.MerchantID,
		"m_payment_id": referenceID,
	}

	signature := c.generateSignature(payload)
	payload["signature"] = signature

	formData := url.Values{}
	for k, v := range payload {
		formData.Set(k, fmt.Sprintf("%v", v))
	}

	httpReq, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/onsite/query", c.APIBase),
		strings.NewReader(formData.Encode()),
	)
	httpReq.Header.Set(contentTypeHeader, contentTypeFormURL)

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("status request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("payfast status check failed")
	}

	return &PaymentStatusResponse{
		ReferenceID: referenceID,
		Status:      "held",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		UpdatedAt:   time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// generateSignature creates PayFast signature for request validation
func (c *PayFastClient) generateSignature(data map[string]interface{}) string {
	// Sort keys
	var keys []string
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build string to sign
	var signString string
	for _, k := range keys {
		signString += fmt.Sprintf("%s=%v&", k, data[k])
	}
	signString += fmt.Sprintf("passphrase=%s", c.MerchantKey)

	// Generate MD5 hash
	hash := md5.Sum([]byte(signString))
	return fmt.Sprintf("%x", hash)
}
