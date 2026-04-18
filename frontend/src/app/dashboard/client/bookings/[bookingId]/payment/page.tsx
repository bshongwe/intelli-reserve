'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentForm } from '@/components/PaymentForm';
import { bookingsAPI, servicesAPI } from '@/lib/api';
import { formatCentsToZAR } from '@/lib/escrow-api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

// ============================================================================
// CONSTANTS
// ============================================================================

const MSG_PAYMENT_REQUIRED = 'Payment Required';
const MSG_PAYMENT_SUBTITLE = 'Complete your booking by making payment';
const MSG_LOADING = 'Loading booking details...';
const MSG_ERROR = 'Failed to load booking details';
const MSG_BACK = '← Back to Bookings';
const MSG_BOOKING_INFO = 'Booking Information';
const MSG_SERVICE = 'Service';
const MSG_DATE_TIME = 'Date & Time';
const MSG_HOST = 'Host';
const MSG_AMOUNT = 'Amount';
const MSG_STATUS = 'Status';
const MSG_BOOKING_ID = 'Booking ID';
const MSG_BOOKING_PENDING = 'Awaiting Payment';

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = params.bookingId as string;

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsAPI.getBooking(bookingId),
    enabled: !!bookingId,
  });

  // Fetch service details
  const { data: services } = useQuery({
    queryKey: ['browse-services'],
    queryFn: () => servicesAPI.getAllServices(),
  });

  // Find current service
  const service = services?.find((s) => s.id === booking?.serviceId);

  const handlePaymentSuccess = () => {
    // Redirect to bookings page after successful payment
    router.push('/dashboard/client/bookings');
  };

  if (bookingLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-pulse">
          <p className="text-muted-foreground">{MSG_LOADING}</p>
        </div>
      </div>
    );
  }

  if (bookingError || !booking || !service) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{MSG_ERROR}</AlertDescription>
        </Alert>
        <Link href="/dashboard/client/bookings">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {MSG_BACK}
          </Button>
        </Link>
      </div>
    );
  }

  // Redirect if booking is not pending or already paid
  if (booking.status !== 'confirmed') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This booking status is {booking.status}. Payment is only required for confirmed bookings.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/client/bookings">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {MSG_BACK}
          </Button>
        </Link>
      </div>
    );
  }

  const amountCents = Math.round((service.basePrice || 0) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{MSG_PAYMENT_REQUIRED}</h1>
          <p className="text-sm text-muted-foreground mt-1">{MSG_PAYMENT_SUBTITLE}</p>
        </div>
        <Link href="/dashboard/client/bookings">
          <Button variant="ghost" className="gap-2">
            {MSG_BACK}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Details - Left Side */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{MSG_BOOKING_INFO}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{MSG_SERVICE}</p>
                <p className="text-sm font-medium">{service.name}</p>
              </div>

              {/* Date & Time */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{MSG_DATE_TIME}</p>
                <p className="text-sm font-medium">
                  {new Date(booking.createdAt).toLocaleDateString('en-ZA', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Time slot details in booking confirmation</p>
              </div>

              {/* Host */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{MSG_HOST}</p>
                <p className="text-sm font-medium">{booking.clientName || 'Service Provider'}</p>
              </div>

              {/* Amount */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{MSG_AMOUNT}</p>
                <p className="text-2xl font-bold text-primary">{formatCentsToZAR(amountCents)}</p>
              </div>

              {/* Status */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{MSG_STATUS}</p>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  ⏳ {MSG_BOOKING_PENDING}
                </p>
              </div>

              {/* Booking ID */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{MSG_BOOKING_ID}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{bookingId}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form - Right Side */}
        <div className="lg:col-span-2">
          <PaymentForm
            bookingId={bookingId}
            hostId={booking.hostId}
            clientId={user?.id || ''}
            amountCents={amountCents}
            clientEmail={booking.clientEmail}
            clientName={booking.clientName}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
}
