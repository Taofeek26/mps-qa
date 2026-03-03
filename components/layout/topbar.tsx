"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildBreadcrumbs } from "@/lib/navigation";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Left: mobile hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <IconButton
            label="Open menu"
            size="sm"
            variant="ghost"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-4 w-4" />
          </IconButton>
        </div>
        {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
