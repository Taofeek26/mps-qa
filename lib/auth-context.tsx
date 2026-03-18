"use client";

import * as React from "react";
import {
  signIn,
  signOut,
  signInWithRedirect,
  getCurrentUser,
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
      console.log("[AuthContext] Checking auth state...");
      const cognitoUser = await getCurrentUser();
      console.log("[AuthContext] Got user:", cognitoUser.userId);

      const session = await fetchAuthSession();
      console.log("[AuthContext] Got session, has tokens:", !!session.tokens?.idToken);

      if (!session.tokens?.idToken) {
        throw new Error("No valid ID token");
      }

      // Get user info from ID token payload (works with federated identity providers)
      const idTokenPayload = session.tokens.idToken.payload;
      const email = (idTokenPayload.email as string) || "";
      const name = (idTokenPayload.name as string) || (idTokenPayload["cognito:username"] as string) || "";

      // Get groups from token
      const groups = (idTokenPayload["cognito:groups"] as string[]) || [];
      const role = mapCognitoGroupToRole(groups);

      console.log("[AuthContext] Got user info from token:", email, name);

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
        email: email,
        displayName: name || email || cognitoUser.username,
        role,
        active: true,
        assignedSiteIds,
      };

      setUserState(mpsUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mpsUser));
      console.log("[AuthContext] User set successfully:", mpsUser.email);
    } catch (err) {
      // No valid session
      console.error("[AuthContext] checkAuthState failed:", err);
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

      // Use the OIDC provider name as configured in Cognito
      await signInWithRedirect({
        provider: {
          custom: 'Microsoft'
        },
        options: {
          preferPrivateSession: false
        }
      });
    } catch (err) {
      console.error("[Auth] Microsoft sign-in error:", err);
      const errorStr = String(err);
      // If already signed in, refresh auth state and redirect
      if (errorStr.includes("Already") || errorStr.includes("already") || errorStr.includes("Authenticated")) {
        console.log("[Auth] User already signed in, refreshing state...");
        await checkAuthState();
        // Redirect to dashboard since user is authenticated
        window.location.href = "/dashboard";
        return;
      }
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
