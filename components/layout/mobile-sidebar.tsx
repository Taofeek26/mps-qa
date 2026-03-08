"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (user && item.roles.includes(user.role))
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        side="left"
        className="w-[280px] sm:max-w-[280px] bg-bg-card"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-14 px-5 border-b border-border-default">
            <Image src="/logo.png" alt="MPS" width={90} height={32} priority />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 h-9 rounded-[var(--radius-sm)] transition-colors text-sm font-medium",
                          active
                            ? "bg-primary-50 text-primary-500"
                            : "text-text-secondary hover:text-text-primary hover:bg-gray-100"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="shrink-0 border-t border-border-default px-5 py-3">
            <p className="text-[11px] text-text-muted">MPS Platform v1.0</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
