"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Minimal, client-safe shape of the logged-in user. Kept separate from the
 * Prisma `User` type so this file has no dependency on `@prisma/client`
 * (which must never end up in client-side bundles).
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  branchId: string | null;
  isActive: boolean;
}

interface AuthContextValue {
  user: AuthUser;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoggingOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Must be used within the (dashboard) route group, where AuthProvider is mounted. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
