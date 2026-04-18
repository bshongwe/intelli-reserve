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
      <title>Dev PayFast Payment - Development</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        .badge {
          display: inline-block;
          background: #ffc107;
          color: #333;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .details {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 6px;
          text-align: left;
          margin-bottom: 20px;
        }
        .details p {
          margin: 8px 0;
          color: #666;
          font-size: 14px;
        }
        .details strong {
          color: #333;
        }
        button {
          margin: 10px 5px;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }
        .success-btn {
          background: #28a745;
          color: white;
        }
        .success-btn:hover {
          background: #218838;
        }
        .cancel-btn {
          background: #dc3545;
          color: white;
        }
        .cancel-btn:hover {
          background: #c82333;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">DEV SANDBOX</div>
        <h1>Dev PayFast Payment</h1>
        <div class="warning">
          ⚠️ This is a development mock payment page. Real payments are disabled.
        </div>
        <div class="details">
          <p><strong>Hold ID:</strong> ${holdId}</p>
          <p><strong>Amount:</strong> R ${parseFloat(amount).toFixed(2)}</p>
          <p><strong>Payer:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          Click "Complete Payment" to simulate a successful payment, or "Cancel" to abort.
        </p>
        <button class="success-btn" onclick="completePayment()">✓ Complete Payment</button>
        <button class="cancel-btn" onclick="cancelPayment()">✗ Cancel</button>
        <script>
          function completePayment() {
            // Send message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'payment_complete',
                success: true,
                holdId: '${holdId}',
                message: 'Mock payment completed successfully'
              }, '*');
            }
            setTimeout(() => window.close(), 500);
          }
          function cancelPayment() {
            if (window.opener) {
              window.opener.postMessage({
                type: 'payment_complete',
                success: false,
                error: 'Payment cancelled by user'
              }, '*');
            }
            setTimeout(() => window.close(), 500);
          }
        </script>
      </div>
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
