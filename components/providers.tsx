"use client";

import { Tooltip } from "radix-ui";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NuqsAdapter>
        <Tooltip.Provider delayDuration={300}>
          {children}
          <Toaster />
        </Tooltip.Provider>
      </NuqsAdapter>
    </AuthProvider>
  );
}
