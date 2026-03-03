"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { getUsers } from "@/lib/mock-data";
import type { User } from "@/lib/types";

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 21"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin",
  admin: "Admin",
  site_user: "Site User",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const activeUsers = React.useMemo(
    () => getUsers().filter((u) => u.active),
    []
  );
  const [selectedUserId, setSelectedUserId] = React.useState("usr-1");

  function handleSignIn() {
    const user = activeUsers.find((u) => u.id === selectedUserId);
    if (!user) return;
    setLoading(true);
    setTimeout(() => {
      setUser(user);
      router.push("/dashboard");
    }, 1000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 px-6 pt-8 pb-8 sm:px-8">
          <Image src="/logo.png" alt="MPS" width={120} height={42} priority />

          <div className="text-center">
            <h1 className="text-lg font-bold text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Sign in to the MPS Waste Shipment Platform
            </p>
          </div>

          {/* User picker for demo/testing */}
          <div className="w-full space-y-1.5">
            <label className="text-xs font-medium text-text-muted">
              Sign in as
            </label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.displayName} ({ROLE_LABELS[u.role] ?? u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSignIn}
            loading={loading}
          >
            <MicrosoftIcon className="h-4 w-4" />
            Sign in with Microsoft
          </Button>

          <div className="text-center">
            <p className="text-[11px] text-text-muted">
              MPS Platform v1.0
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Powered by MPS Group
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
