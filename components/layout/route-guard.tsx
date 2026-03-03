"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toast";
import type { UserRole } from "@/lib/types";

/** Route → required roles mapping. Routes not listed are accessible to all authenticated users. */
const ROUTE_RULES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin/audit-log", roles: ["admin", "system_admin"] },
  { prefix: "/admin/", roles: ["system_admin"] },
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = React.useState(true);

  React.useEffect(() => {
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
  }, [pathname, user, router]);

  if (!user || !allowed) return null;

  return <>{children}</>;
}
