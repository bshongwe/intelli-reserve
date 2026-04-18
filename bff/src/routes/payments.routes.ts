import { Router, Request, Response } from 'express';

/**
 * Payment Routes
 * Handles payment processing via PayFast and other gateways
 * Supports sandbox (dev) and production environments
 */

const router = Router();

// ============================================================================
// CONSTANTS
// ============================================================================

// PayFast URLs
const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
const PAYFAST_PRODUCTION_URL = 'https://www.payfast.co.za/eng/process';

// Environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PAYFAST_ENV = process.env.PAYFAST_ENV || (IS_PRODUCTION ? 'production' : 'sandbox');
const PAYFAST_URL = PAYFAST_ENV === 'production' ? PAYFAST_PRODUCTION_URL : PAYFAST_SANDBOX_URL;

// Credentials (should come from environment)
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || 'test-merchant';
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'test-key';

// Callback URLs
const BFF_BASE_URL = process.env.BFF_BASE_URL || 'http://localhost:3001';
const RETURN_URL = `${BFF_BASE_URL}/api/payments/payfast/return`;
const CANCEL_URL = `${BFF_BASE_URL}/api/payments/payfast/cancel`;
const NOTIFY_URL = `${BFF_BASE_URL}/api/payments/payfast/notify`;

// ============================================================================
// ERROR & SUCCESS MESSAGES
// ============================================================================

const MSG_INVALID_PARAMS = 'Invalid payment parameters';
const MSG_PAYMENT_INITIATED = 'Payment initiated successfully';
const MSG_PAYMENT_COMPLETED = 'Payment completed successfully';
const MSG_PAYMENT_FAILED = 'Payment failed';
const MSG_PAYMENT_CANCELLED = 'Payment cancelled';
const MSG_IPN_RECEIVED = 'IPN received';
const MSG_IPN_INVALID = 'Invalid IPN received';

// ============================================================================
// MOCK PAYMENT HANDLER (for development without real PayFast)
// ============================================================================

/**
 * Mock payment for local development
 * Returns a simple success page
 */
function generateMockPaymentPage(holdId: string, amount: string, email: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Secure Payment - IntelliReserve via PayFast</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #ED5F59 0%, #E63946 25%, #A4161A 50%, #E63946 75%, #ED5F59 100%);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          padding: 20px;
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .payment-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          max-width: 480px;
          width: 100%;
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Header with brand logos */
        .payment-header {
          background: linear-gradient(135deg, #ED5F59 0%, #E63946 100%);
          padding: 30px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .payment-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .brand-logos {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .logo-box {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* IntelliReserve Logo SVG */
        .ir-logo {
          width: 100px;
          height: 40px;
        }
        
        /* PayFast Logo - simplified */
        .payfast-logo {
          font-weight: 900;
          font-size: 14px;
          color: #E60012;
          letter-spacing: 0.5px;
        }
        
        .connector {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 300;
        }
        
        .header-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-top: 12px;
        }
        
        .header-subtitle {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin-top: 6px;
          font-weight: 400;
        }
        
        /* Badge for dev/prod */
        .environment-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Payment body */
        .payment-body {
          padding: 32px 24px;
        }
        
        .payment-details {
          background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #e9ecef;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          font-size: 14px;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          color: #666;
          font-weight: 500;
        }
        
        .detail-value {
          color: #1a1a1a;
          font-weight: 600;
        }
        
        .amount-total {
          background: linear-gradient(135deg, #ED5F59 0%, #E63946 100%);
          color: white;
          padding: 16px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: center;
        }
        
        .amount-total .label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 6px;
        }
        
        .amount-total .value {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .security-note {
          background: #e8f4f8;
          border-left: 4px solid #0288d1;
          padding: 12px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 13px;
          color: #01579b;
          line-height: 1.5;
        }
        
        .security-note strong {
          color: #004d7a;
        }
        
        .security-note svg {
          color: #0288d1;
        }
        
        /* Action buttons */
        .payment-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }
        
        button {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .btn-complete {
          background: linear-gradient(135deg, #ED5F59 0%, #E63946 100%);
          color: white;
        }
        
        .btn-complete:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 57, 70, 0.4);
        }
        
        .btn-complete:active {
          transform: translateY(0);
        }
        
        .btn-complete svg,
        .btn-cancel svg {
          color: currentColor;
        }
        
        .btn-cancel {
          background: #f0f0f0;
          color: #333;
        }
        
        .btn-cancel:hover {
          background: #e0e0e0;
          transform: translateY(-2px);
        }
        
        .btn-cancel:active {
          transform: translateY(0);
        }
        
        /* Dev mode warning */
        .dev-warning {
          background: #fff8e1;
          border: 1px solid #ffe082;
          border-radius: 8px;
          padding: 12px;
          margin-top: 20px;
          font-size: 12px;
          color: #f57f17;
          text-align: center;
          line-height: 1.5;
        }
        
        .dev-warning strong {
          color: #e65100;
        }
        
        .dev-warning svg {
          color: #f57f17;
        }
        
        /* Responsive */
        @media (max-width: 480px) {
          .payment-container {
            border-radius: 12px;
          }
          
          .payment-header {
            padding: 24px 16px;
          }
          
          .payment-body {
            padding: 24px 16px;
          }
          
          .brand-logos {
            flex-direction: column;
            gap: 12px;
          }
          
          .connector {
            display: none;
          }
          
          button {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="payment-container">
        <!-- Header with Logos -->
        <div class="payment-header">
          <div class="header-content">
            <div class="brand-logos">
              <!-- IntelliReserve Logo -->
              <div class="logo-box">
                <svg class="ir-logo" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                  <!-- Zap Icon -->
                  <g transform="translate(8, 6)">
                    <path d="M12 2L2 14h7l-1 12 10-12h-7l1-12z" fill="#ED5F59" stroke="#ED5F59" stroke-width="1.5" stroke-linejoin="round"/>
                  </g>
                  <!-- IntelliReserve Text -->
                  <text x="28" y="12" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#1a1a1a">IntelliReserve</text>
                  <text x="28" y="26" font-family="Arial, sans-serif" font-size="7" fill="#ED5F59" font-weight="600">Booking + Escrow</text>
                </svg>
              </div>
              
              <div class="connector">+</div>
              
              <!-- PayFast Logo -->
              <div class="logo-box">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                  <svg width="32" height="20" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
                    <!-- PayFast simplified logo -->
                    <rect x="10" y="10" width="15" height="40" fill="#E60012" rx="2"/>
                    <rect x="30" y="10" width="15" height="40" fill="#E60012" rx="2" opacity="0.7"/>
                    <rect x="50" y="10" width="15" height="40" fill="#E60012" rx="2" opacity="0.5"/>
                    <rect x="70" y="10" width="15" height="40" fill="#E60012" rx="2" opacity="0.3"/>
                  </svg>
                  <div class="payfast-logo">PayFast</div>
                </div>
              </div>
            </div>
            
            <div class="header-title">Secure Payment</div>
            <div class="header-subtitle">Protected by IntelliReserve Escrow</div>
            <div class="environment-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Sandbox
            </div>
          </div>
        </div>
        
        <!-- Payment Details -->
        <div class="payment-body">
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Payer
              </span>
              <span class="detail-value">${name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M22 6l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 6"></path>
                </svg>
                Email
              </span>
              <span class="detail-value">${email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Hold ID
              </span>
              <span class="detail-value" style="font-size: 12px; font-family: monospace;">${holdId.substring(0, 12)}...</span>
            </div>
          </div>
          
          <!-- Amount Total -->
          <div class="amount-total">
            <div class="label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
              TOTAL AMOUNT
            </div>
            <div class="value">R ${Number.parseFloat(amount).toFixed(2)}</div>
          </div>
          
          <!-- Security Note -->
          <div class="security-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px; vertical-align: text-bottom; flex-shrink: 0;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <strong>Protected Payment:</strong> Your funds are held in escrow and only released to the service provider after you confirm service completion.
          </div>
          
          <!-- Action Buttons -->
          <div class="payment-actions">
            <button class="btn-complete" onclick="completePayment()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Complete Payment
            </button>
            <button class="btn-cancel" onclick="cancelPayment()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
          </div>
          
          <!-- Dev Warning -->
          <div class="dev-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: text-bottom;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <strong>DEVELOPMENT MODE:</strong><br/>
            This is a sandbox simulation. Real payments are disabled. Click "Complete Payment" to simulate a successful transaction.
          </div>
        </div>
      </div>
      
      <script>
        function completePayment() {
          // Simulate payment processing
          const btn = event.target;
          btn.disabled = true;
          btn.textContent = '⏳ Processing...';
          
          // Simulate network delay
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({
                type: 'payment_complete',
                success: true,
                holdId: '${holdId}',
                amount: '${amount}',
                message: 'Payment completed successfully'
              }, '*');
            }
            
            // Close after a short delay to show success animation
            setTimeout(() => {
              window.close();
            }, 800);
          }, 1500);
        }
        
        function cancelPayment() {
          if (window.opener) {
            window.opener.postMessage({
              type: 'payment_complete',
              success: false,
              error: 'Payment cancelled by user'
            }, '*');
          }
          window.close();
        }
      </script>
    </body>
    </html>
  `;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/payments/payfast
 * Initiates a PayFast payment
 * Query params: holdId, amount, email, name
 */
router.get('/payfast', (req: Request, res: Response) => {
  try {
    const { holdId, amount, email, name } = req.query;

    // Validate parameters
    if (!holdId || !amount || !email || !name) {
      return res.status(400).json({ error: MSG_INVALID_PARAMS });
    }

    // Cast to strings for proper type handling
    const holdIdStr = typeof holdId === 'string' ? holdId : (holdId as string[])[0];
    const amountStr = typeof amount === 'string' ? amount : (amount as string[])[0];
    const emailStr = typeof email === 'string' ? email : (email as string[])[0];
    const nameStr = typeof name === 'string' ? name : (name as string[])[0];

    // Use mock payment in development, real PayFast in production
    if (PAYFAST_ENV === 'sandbox' || !IS_PRODUCTION) {
      // Return mock payment page
      const mockPage = generateMockPaymentPage(
        holdIdStr,
        amountStr,
        emailStr,
        nameStr
      );
      return res.send(mockPage);
    }

    // Production: Generate real PayFast form
    const merchantId = MERCHANT_ID;
    const merchantKey = MERCHANT_KEY;
    const amountCents = Math.round(Number.parseFloat(amountStr) * 100);
    const amountRand = (amountCents / 100).toFixed(2);

    // Generate PayFast form HTML
    const form = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to PayFast...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Redirecting to PayFast...</h1>
          <p>Please wait while we redirect you to complete your payment securely.</p>
        </div>
        <form id="payfast-form" method="POST" action="${PAYFAST_URL}">
          <input type="hidden" name="merchant_id" value="${merchantId}">
          <input type="hidden" name="merchant_key" value="${merchantKey}">
          <input type="hidden" name="return_url" value="${RETURN_URL}">
          <input type="hidden" name="cancel_url" value="${CANCEL_URL}">
          <input type="hidden" name="notify_url" value="${NOTIFY_URL}">
          <input type="hidden" name="amount" value="${amountRand}">
          <input type="hidden" name="item_name" value="Service Booking - Hold ID: ${holdIdStr}">
          <input type="hidden" name="item_description" value="Payment for service booking">
          <input type="hidden" name="reference" value="${holdIdStr}">
          <input type="hidden" name="custom_str1" value="${holdIdStr}">
          <input type="hidden" name="email_confirmation" value="1">
          <input type="hidden" name="confirmation_address" value="${emailStr}">
        </form>
        <script>
          document.getElementById('payfast-form').submit();
        </script>
      </body>
      </html>
    `;

    res.send(form);
  } catch (error: any) {
    console.error('[Payments Routes] Error initiating PayFast payment:', error);
    res.status(500).json({
      error: MSG_PAYMENT_FAILED,
      details: error.message,
    });
  }
});

/**
 * GET /api/payments/payfast/return
 * PayFast return URL (after payment)
 */
router.get('/payfast/return', (req: Request, res: Response) => {
  try {
    const { pnp_reference, reference } = req.query;

    console.log('[Payments Routes] PayFast return:', { pnp_reference, reference });

    // Redirect back to frontend with success
    const refStr = typeof reference === 'string' ? reference : (reference as string[])[0];
    const pnpStr = typeof pnp_reference === 'string' ? pnp_reference : (pnp_reference as string[])[0];
    const holdId = refStr || pnpStr;

    res.redirect(
      `http://localhost:3000/dashboard/client/bookings?payment_success=true&holdId=${holdId}`
    );
  } catch (error: any) {
    console.error('[Payments Routes] Error in return handler:', error);
    res.status(500).json({ error: MSG_PAYMENT_FAILED });
  }
});

/**
 * GET /api/payments/payfast/cancel
 * PayFast cancel URL (payment cancelled)
 */
router.get('/payfast/cancel', (req: Request, res: Response) => {
  try {
    console.log('[Payments Routes] PayFast payment cancelled');

    // Redirect back to frontend with cancellation
    res.redirect(`http://localhost:3000/dashboard/client/bookings?payment_cancelled=true`);
  } catch (error: any) {
    console.error('[Payments Routes] Error in cancel handler:', error);
    res.status(500).json({ error: MSG_PAYMENT_CANCELLED });
  }
});

/**
 * POST /api/payments/payfast/notify
 * PayFast IPN (Instant Payment Notification) webhook
 */
router.post('/payfast/notify', (req: Request, res: Response) => {
  try {
    const { m_payment_id, pnp_reference, reference, amount_gross, m_status } = req.body;

    console.log('[Payments Routes] PayFast IPN received:', {
      m_payment_id,
      pnp_reference,
      reference,
      amount_gross,
      m_status,
    });

    // NOTE: IPN validation should verify signature against PayFast credentials
    // IPN should be logged for audit trail and payment reconciliation
    // Hold status updates based on payment status should trigger notifications

    res.json({
      message: MSG_IPN_RECEIVED,
      status: m_status,
    });
  } catch (error: any) {
    console.error('[Payments Routes] Error processing IPN:', error);
    res.status(400).json({
      error: MSG_IPN_INVALID,
      details: error.message,
    });
  }
});

export default router;
