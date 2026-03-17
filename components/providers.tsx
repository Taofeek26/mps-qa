"use client";

import { Tooltip } from "radix-ui";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth-context";
import { configureAmplify } from "@/lib/amplify-config";

// Initialize Amplify on client side
console.log("[Amplify] Configuring with User Pool ID:", process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log("[Amplify] Client ID:", process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
configureAmplify();

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
