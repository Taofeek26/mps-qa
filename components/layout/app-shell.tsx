"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { MobileSidebar } from "./mobile-sidebar";
import { RouteGuard } from "./route-guard";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-bg-app">
      {/* Desktop sidebar */}
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile sidebar (drawer) */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-[1440px]">
            <RouteGuard>{children}</RouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
