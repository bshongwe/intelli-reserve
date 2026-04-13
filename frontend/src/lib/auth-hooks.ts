"use client";

/**
 * Custom React hooks for authentication patterns
 */

import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}

/**
 * Hook to require specific user type (host or client)
 */
export function useRequireUserType(requiredType: "host" | "client") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.userType !== requiredType) {
      router.push("/dashboard");
    }
  }, [user, isLoading, requiredType, router]);

  return { isLoading, authorized: user?.userType === requiredType };
}

/**
 * Hook to get current user ID
 * Returns placeholder if not authenticated (for development)
 */
export function useCurrentUserId(): string {
  const { user } = useAuth();
  return user?.id ?? "";
}

export function useCurrentHostId(): string {
  const { user } = useAuth();
  return user?.userType === "host" ? (user?.id ?? "") : "";
}

export function useCurrentClientEmail(): string {
  const { user } = useAuth();
  return user?.userType === "client" ? (user?.email ?? "") : "";
}
