"use client";

import * as React from "react";
import type { User, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  /** Check if user has one of the required roles */
  hasRole: (roles: UserRole[]) => boolean;
  /** Check if user can access a specific site (admins can access all) */
  canAccessSite: (siteId: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "mps_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  /* Hydrate from localStorage on mount */
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUserState(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  function setUser(u: User | null) {
    setUserState(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function hasRole(roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  function canAccessSite(siteId: string): boolean {
    if (!user) return false;
    if (user.role === "admin" || user.role === "system_admin") return true;
    return user.assignedSiteIds?.includes(siteId) ?? false;
  }

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, setUser, hasRole, canAccessSite }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  /* Don't render children until hydration is complete to avoid flash */
  if (!hydrated) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
