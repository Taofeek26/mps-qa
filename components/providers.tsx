"use client";

import { Tooltip } from "radix-ui";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tooltip.Provider delayDuration={300}>
        {children}
        <Toaster />
      </Tooltip.Provider>
    </AuthProvider>
  );
}
