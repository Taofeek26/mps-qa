"use client";

import * as React from "react";
import {
  signIn,
  signOut,
  signInWithRedirect,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from "aws-amplify/auth";
import type { User, UserRole } from "@/lib/types";
import { usersApi } from "@/lib/api-client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  signInWithMicrosoft: () => Promise<void>;
  signOutUser: () => Promise<void>;
  /** Check if user has one of the required roles */
  hasRole: (roles: UserRole[]) => boolean;
  /** Check if user can access a specific site (admins can access all) */
  canAccessSite: (siteId: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "mps_current_user";

// Map Cognito group to UserRole (groups are lowercase in Cognito)
function mapCognitoGroupToRole(groups: string[]): UserRole {
  // Normalize to lowercase for comparison
  const lowerGroups = groups.map(g => g.toLowerCase());
  if (lowerGroups.includes("admin")) return "admin";
  if (lowerGroups.includes("manager")) return "manager";
  if (lowerGroups.includes("operator")) return "operator";
  if (lowerGroups.includes("viewer")) return "viewer";
  return "viewer";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Check for existing session on mount
  React.useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      setLoading(true);
      const cognitoUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const session = await fetchAuthSession();

      // Get groups from token
      const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || [];
      const role = mapCognitoGroupToRole(groups);

      // Try to get full user profile from backend
      let assignedSiteIds: string[] = [];
      try {
        const profileResponse = await usersApi.getProfile();
        if (profileResponse.data) {
          const profile = profileResponse.data as { user: { assigned_site_ids?: string[] } };
          assignedSiteIds = profile.user?.assigned_site_ids || [];
        }
      } catch {
        // Profile fetch failed, continue without site assignments
      }

      const mpsUser: User = {
        id: cognitoUser.userId,
        email: attributes.email || "",
        displayName: attributes.name || attributes.email || cognitoUser.username,
        role,
        active: true,
        assignedSiteIds,
      };

      setUserState(mpsUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mpsUser));
    } catch {
      // No valid session
      setUserState(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithCredentials(email: string, password: string): Promise<boolean> {
    try {
      setLoading(true);
      setError(null);

      console.log("[Auth] Attempting sign in for:", email);

      const result = await signIn({
        username: email,
        password,
      });

      console.log("[Auth] Sign in result:", result);

      if (result.isSignedIn) {
        await checkAuthState();
        return true;
      }

      // Handle challenges (e.g., NEW_PASSWORD_REQUIRED)
      if (result.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setError("Password change required. Please contact administrator.");
        return false;
      }

      setError("Sign in failed. Please try again.");
      return false;
    } catch (err) {
      console.error("[Auth] Sign in error:", err);
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithMicrosoft(): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      console.log("[Auth] Initiating Microsoft sign-in...");

      await signInWithRedirect({
        provider: {
          custom: 'Microsoft'
        }
      });
    } catch (err) {
      console.error("[Auth] Microsoft sign-in error:", err);
      const message = err instanceof Error ? err.message : "Microsoft sign-in failed";
      setError(message);
      setLoading(false);
    }
  }

  async function signOutUser() {
    try {
      await signOut();
      setUserState(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  function hasRole(roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  function canAccessSite(siteId: string): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.assignedSiteIds?.includes(siteId) ?? false;
  }

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithCredentials,
      signInWithMicrosoft,
      signOutUser,
      hasRole,
      canAccessSite,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
