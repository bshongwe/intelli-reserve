import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { bookingsAPI } from "@/lib/api";

export type NotificationKind =
  | "booking_pending"      // client: booking awaiting host confirmation
  | "booking_confirmed"    // client: host confirmed their booking
  | "booking_cancelled"    // client: host rejected their booking
  | "host_pending_action"; // host: incoming booking needs a response

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();

  // **** ── Client notifications ───────────────────────────────────────── ****
  const { data: clientBookings = [] } = useQuery({
    queryKey: ["client-bookings", user?.email],
    queryFn: () => bookingsAPI.getClientBookings(user!.email),
    enabled: !!user && user.userType === "client",
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  // **** ── Host notifications ───────────────────────────────────────── ****
  const { data: hostPendingBookings = [] } = useQuery({
    queryKey: ["pending-bookings", user?.id],
    queryFn: () => bookingsAPI.getHostBookings(user!.id, "pending"),
    enabled: !!user && user.userType === "host",
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
  });

  const notifications: AppNotification[] = [];

  if (user?.userType === "client") {
    for (const b of clientBookings as any[]) {
      if (b.status === "pending") {
        notifications.push({
          id: `booking-pending-${b.id}`,
          kind: "booking_pending",
          title: "Booking Awaiting Confirmation",
          description: `Your booking is pending host approval.`,
          href: "/dashboard/client/bookings",
          createdAt: b.createdAt,
        });
      } else if (b.status === "confirmed") {
        // Only surface confirmed bookings created in the last 24hrs
        const age = Date.now() - new Date(b.createdAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          notifications.push({
            id: `booking-confirmed-${b.id}`,
            kind: "booking_confirmed",
            title: "Booking Confirmed!",
            description: `Your booking has been confirmed by the host.`,
            href: "/dashboard/client/bookings",
            createdAt: b.updatedAt ?? b.createdAt,
          });
        }
      } else if (b.status === "cancelled") {
        // Only surface recent cancellations
        const age = Date.now() - new Date(b.updatedAt ?? b.createdAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          notifications.push({
            id: `booking-cancelled-${b.id}`,
            kind: "booking_cancelled",
            title: "Booking Cancelled",
            description: `A booking was cancelled.`,
            href: "/dashboard/client/bookings",
            createdAt: b.updatedAt ?? b.createdAt,
          });
        }
      }
    }
  }

  if (user?.userType === "host") {
    // **** ── Host notifications ───────────────────────────────────────── ****
    for (const b of hostPendingBookings as any[]) {
      notifications.push({
        id: `host-pending-${b.id}`,
        kind: "host_pending_action",
        title: "New Booking Request",
        description: `${b.clientName} is requesting a booking.`,
        href: "/dashboard/host",
        createdAt: b.createdAt,
      });
    }
  }

  // Sort newest first
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { notifications, count: notifications.length };
}
