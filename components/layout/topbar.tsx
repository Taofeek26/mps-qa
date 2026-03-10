"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildBreadcrumbs } from "@/lib/navigation";
import { CommandPalette } from "@/components/ui/command-palette";
import { Notifications } from "./notifications";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const crumbs = buildBreadcrumbs(pathname, tab);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4 lg:px-6 transition-colors duration-150 ease-out">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-3">
        {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      </div>

      {/* Right: search + notifications + user menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        <CommandPalette />
        <Notifications />
        <div className="mx-1 h-5 w-px bg-border-default hidden sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
