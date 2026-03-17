"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toast";
import type { UserRole } from "@/lib/types";

/** Route → required roles mapping. Routes not listed are accessible to all authenticated users. */
const ROUTE_RULES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin/audit-log", roles: ["admin", "manager"] },
  { prefix: "/admin/", roles: ["admin"] },
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = React.useState(true);

  React.useEffect(() => {
    // Wait for auth check to complete
    if (loading) return;

    /* No user → redirect to login */
    if (!user) {
      router.replace("/login");
      return;
    }

    /* Check route-level role rules (first match wins) */
    for (const rule of ROUTE_RULES) {
      if (pathname.startsWith(rule.prefix)) {
        if (!rule.roles.includes(user.role)) {
          setAllowed(false);
          toast.error("Access denied", {
            description: "You don't have permission to view this page.",
          });
          router.replace("/dashboard");
          return;
        }
        break;
      }
    }

    setAllowed(true);
  }, [pathname, user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user || !allowed) return null;

  return <>{children}</>;
}
