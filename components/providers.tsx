"use client";

import { Tooltip } from "radix-ui";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      {children}
      <Toaster />
    </Tooltip.Provider>
  );
}
