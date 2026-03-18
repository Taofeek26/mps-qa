"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

// Microsoft Logo SVG Component
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithMicrosoft, loading, error, user } = useAuth();
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleMicrosoftSignIn() {
    setLocalError(null);
    try {
      await signInWithMicrosoft();
    } catch (err) {
      console.error("Microsoft sign-in error:", err);
      setLocalError("Failed to initiate Microsoft sign-in. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-4 sm:p-6">
      <Card className="w-full max-w-[400px] border-border-default shadow-sm">
        <CardContent className="flex flex-col items-stretch gap-6 px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8">
          <div className="flex justify-start">
            <Image src="/logo.png" alt="MPS" width={120} height={42} priority />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="text-sm text-text-muted">
              Sign in to the MPS Waste Shipment Platform
            </p>
          </div>

          <div className="space-y-4">
            {(error || localError) && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error || localError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleMicrosoftSignIn}
              className="w-full bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white"
              size="lg"
              disabled={loading}
            >
              <MicrosoftLogo className="h-5 w-5 mr-3" />
              {loading ? "Signing in..." : "Sign in with Microsoft"}
            </Button>

            <p className="text-center text-xs text-text-muted">
              Use your Microsoft work or personal account to sign in
            </p>
          </div>

          <div className="border-t border-border-default pt-5 space-y-1.5">
            <p className="text-xs text-text-muted">MPS Platform v1.0 (QA)</p>
            <p className="text-xs text-text-muted/80">Powered by MPS Group</p>
            <p className="text-xs text-text-muted/80">
              Designed and built by{" "}
              <Link
                href="https://whitelabelresell.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text-muted transition-colors"
              >
                White Label Resell
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
