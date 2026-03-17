"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithCredentials, loading, error, user } = useAuth();
  const [email, setEmail] = React.useState("testadmin@mps.com");
  const [password, setPassword] = React.useState("Password123");
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please enter email and password");
      return;
    }

    const success = await signInWithCredentials(email, password);
    if (success) {
      router.push("/dashboard");
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

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
                Email
              </label>
              <TextInput
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                Password
              </label>
              <TextInput
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {(error || localError) && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error || localError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

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
