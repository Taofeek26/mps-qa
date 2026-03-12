"use client";

import Link from "next/link";
import {
  FileBarChart,
  Briefcase,
  Building2,
  FileText,
  Factory,
  Users,
  ScrollText,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface MoreItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: string;
  roles?: string[];
}

const MORE_ITEMS: MoreItem[] = [
  { label: "Report Builder", description: "Build custom reports with drag-and-drop widgets", href: "/reports/builder", icon: FileBarChart, group: "Primary" },
  { label: "Clients & Sites", description: "Manage client accounts and site locations", href: "/admin/clients", icon: Briefcase, group: "Administration", roles: ["system_admin"] },
  { label: "Vendors", description: "Vendor profiles, qualifications, and risk levels", href: "/admin/vendors", icon: Building2, group: "Administration", roles: ["system_admin"] },
  { label: "Reference Data", description: "Waste types, codes, and classification data", href: "/admin/reference-data", icon: FileText, group: "Administration", roles: ["system_admin"] },
  { label: "Facilities & Transport", description: "Receiving facilities, transporters, and containers", href: "/admin/facilities", icon: Factory, group: "Administration", roles: ["system_admin"] },
  { label: "Users", description: "User accounts, roles, and permissions", href: "/admin/users", icon: Users, group: "Administration", roles: ["system_admin"] },
  { label: "Audit Log", description: "Activity history and change tracking", href: "/admin/audit-log", icon: ScrollText, group: "Administration", roles: ["admin", "system_admin"] },
];

export default function MorePage() {
  const { user } = useAuth();

  const filtered = MORE_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const groups = new Map<string, MoreItem[]>();
  for (const item of filtered) {
    const existing = groups.get(item.group) ?? [];
    existing.push(item);
    groups.set(item.group, existing);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {group}
          </p>
          <div className="-mx-4 bg-bg-card">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === items.length - 1;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 pl-4 transition-colors active:bg-bg-subtle"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-success-400/20 border border-success-400/30 text-success-600">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className={cn(
                    "flex flex-1 items-center gap-3 py-4 pr-4 mr-4 min-w-0",
                    !isLast && "border-b border-border-strong"
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
