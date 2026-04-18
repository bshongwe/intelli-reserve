'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createHold, formatCentsToZAR } from '@/lib/escrow-api';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// CONSTANTS
// ============================================================================

const MSG_PAYMENT_TITLE = 'Secure Payment via PayFast';
const MSG_PAYMENT_DESC = 'Click below to complete your payment securely through PayFast. A popup window will open.';
const MSG_SECURITY_NOTE = 'Your payment is protected by escrow. Funds are only released to the host after you confirm service completion.';
const MSG_PROCESSING = 'Redirecting to PayFast...';
const MSG_SUBMIT = 'Pay Now with PayFast';
const MSG_ERROR = 'Payment failed';
const MSG_SUCCESS = 'Payment successful';
const MSG_AMOUNT_REQUIRED = 'Service Amount:';
const MSG_PLATFORM_FEE = 'Platform Fee (10%):';
const MSG_TOTAL = 'Total:';
const MSG_WAITING = 'Waiting for payment confirmation...';

// ============================================================================
// PROPS & TYPES
// ============================================================================

interface PaymentFormProps {
  readonly bookingId: string;
  readonly hostId: string;
  readonly clientId: string;
  readonly amountCents: number;
  readonly clientEmail: string;
  readonly clientName: string;
  readonly onSuccess?: () => void;
  readonly onError?: (error: string) => void;
}

// ============================================================================
// PAYMENT FORM COMPONENT - PayFast Integration
// ============================================================================

export function PaymentForm({
  bookingId,
  hostId,
  clientId,
  amountCents,
  clientEmail,
  clientName,
  onSuccess,
  onError,
}: Readonly<PaymentFormProps>) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);

  const platformFeeCents = Math.round(amountCents * 0.1);

  // Listen for payment completion message from PayFast popup
  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Accept messages from PayFast domain or localhost (dev/sandbox)
      const isValidOrigin = 
        event.origin.includes('payfast') || 
        event.origin.includes('localhost') ||
        event.origin.includes('127.0.0.1');
      
      if (!isValidOrigin) return;

      if (event.data.type === 'payment_complete') {
        setIsProcessing(false);
        if (paymentWindow) paymentWindow.close();

        if (event.data.success) {
          toast({
            title: MSG_SUCCESS,
            description: `Payment of ${formatCentsToZAR(amountCents)} held in escrow`,
          });
          // Delay redirect to allow user to see success message
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        } else {
          const errorMsg = event.data.error || MSG_ERROR;
          toast({
            title: MSG_ERROR,
            description: errorMsg,
            variant: 'destructive',
          });
          onError?.(errorMsg);
        }
      }
    };

    if (isProcessing) {
      globalThis.window?.addEventListener('message', handlePaymentMessage);
      return () => {
        globalThis.window?.removeEventListener('message', handlePaymentMessage);
      };
    }
    return undefined;
  }, [isProcessing, paymentWindow, amountCents, onSuccess, onError, toast]);

  const createHoldMutation = useMutation({
    mutationFn: async () => {
      return createHold(
        bookingId,
        hostId,
        clientId,
        amountCents,
        platformFeeCents,
        'booking_payment'
      );
    },
    onSuccess: (hold) => {
      // After creating hold, redirect to PayFast payment page
      setIsProcessing(true);
      const paymentUrl = `/api/payments/payfast?holdId=${hold.id}&amount=${amountCents / 100}&email=${encodeURIComponent(clientEmail)}&name=${encodeURIComponent(clientName)}`;
      const popup = globalThis.window?.open(paymentUrl, 'PayFast', 'width=800,height=600');
      setPaymentWindow(popup || null);
    },
    onError: (error: Error) => {
      const errorMsg = error?.message || MSG_ERROR;
      toast({
        title: MSG_ERROR,
        description: errorMsg,
        variant: 'destructive',
      });
      onError?.(errorMsg);
    },
  });

  const handlePayClick = () => {
    createHoldMutation.mutate();
  };

  if (createHoldMutation.isSuccess && paymentWindow) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-spin" />
          </div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">{MSG_WAITING}</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
            PayFast payment window is open. Please complete your payment to continue.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (createHoldMutation.isSuccess) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">{MSG_SUCCESS}</h3>
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
            {formatCentsToZAR(amountCents)} has been held in escrow for your booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {MSG_PAYMENT_TITLE}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{MSG_PAYMENT_DESC}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Amount Summary */}
          <div className="bg-secondary/60 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{MSG_AMOUNT_REQUIRED}</span>
              <span className="font-semibold">{formatCentsToZAR(amountCents - platformFeeCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{MSG_PLATFORM_FEE}</span>
              <span className="font-semibold">{formatCentsToZAR(platformFeeCents)}</span>
            </div>
            <div className="border-t border-secondary pt-2 flex justify-between text-sm font-bold">
              <span>{MSG_TOTAL}</span>
              <span className="text-primary">{formatCentsToZAR(amountCents)}</span>
            </div>
          </div>

          {/* Security Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
              {MSG_SECURITY_NOTE}
            </AlertDescription>
          </Alert>

          {/* PayFast Button */}
          <Button
            onClick={handlePayClick}
            disabled={createHoldMutation.isPending || isProcessing}
            className="w-full gap-2"
          >
            {createHoldMutation.isPending || isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {MSG_PROCESSING}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {MSG_SUBMIT}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
