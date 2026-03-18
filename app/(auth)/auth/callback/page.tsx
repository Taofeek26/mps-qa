"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check for error in URL params (OAuth error response)
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("[Auth Callback] OAuth error:", error, errorDescription);
      setStatus("error");
      setErrorMessage(errorDescription || `OAuth error: ${error}`);
      return;
    }

    // Listen for auth events
    const unsubscribe = Hub.listen("auth", async ({ payload }) => {
      console.log("[Auth Callback] Hub event:", payload.event, payload.data);

      switch (payload.event) {
        case "signInWithRedirect":
          console.log("[Auth Callback] Sign in redirect completed");
          break;
        case "signInWithRedirect_failure":
          console.error("[Auth Callback] Sign in failed:", payload.data);
          setStatus("error");
          const errorData = payload.data as { error?: string; message?: string } | undefined;
          setErrorMessage(errorData?.message || errorData?.error || "Authentication failed. Please try again.");
          break;
        case "customOAuthState":
          console.log("[Auth Callback] Custom OAuth state:", payload.data);
          break;
        case "tokenRefresh":
          console.log("[Auth Callback] Token refreshed");
          break;
        case "tokenRefresh_failure":
          console.error("[Auth Callback] Token refresh failed:", payload.data);
          break;
      }
    });

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Small delay to allow Amplify to process the callback
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Try to get current user
        const user = await getCurrentUser();
        console.log("[Auth Callback] User authenticated:", user.userId);

        // Also verify we have a valid session
        const session = await fetchAuthSession();
        if (session.tokens?.idToken) {
          console.log("[Auth Callback] Valid session obtained");
          setStatus("success");
          // Redirect to dashboard after successful auth
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        } else {
          throw new Error("No valid tokens in session");
        }
      } catch (error) {
        console.error("[Auth Callback] Auth check error:", error);
        // If no user, wait a bit more and retry once
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          const user = await getCurrentUser();
          const session = await fetchAuthSession();
          if (session.tokens?.idToken) {
            console.log("[Auth Callback] User authenticated on retry:", user.userId);
            setStatus("success");
            router.push("/dashboard");
          } else {
            throw new Error("No valid tokens after retry");
          }
        } catch (retryError) {
          console.error("[Auth Callback] Retry failed:", retryError);
          setStatus("error");
          const errMsg = retryError instanceof Error ? retryError.message : "Unknown error";
          setErrorMessage(`Unable to complete authentication: ${errMsg}`);
        }
      }
    };

    checkAuth();

    return () => {
      unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-4">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-lg font-medium text-text-primary">
              Completing sign in...
            </p>
            <p className="text-sm text-text-muted">
              Please wait while we verify your credentials.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-text-primary">
              Sign in successful!
            </p>
            <p className="text-sm text-text-muted">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-text-primary">
              Sign in failed
            </p>
            <p className="text-sm text-text-muted">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
