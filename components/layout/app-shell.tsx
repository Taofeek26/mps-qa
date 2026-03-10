"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { MobileTabBar } from "./mobile-tab-bar";
import { RouteGuard } from "./route-guard";
import { TabsPortalProvider } from "@/components/ui/tabs";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const tabsPortalRef = React.useRef<HTMLDivElement>(null);
  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setPortalNode(tabsPortalRef.current);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg-app">
      {/* Desktop sidebar */}
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        {/* Tab bar portal target — sits between topbar and main */}
        <div ref={tabsPortalRef} className="sticky top-14 z-20" />
        <main className="flex-1">
          {/* pb-20 on mobile to clear the fixed bottom tab bar */}
          <div className="px-4 pt-4 pb-20 lg:px-6 lg:pt-6 lg:pb-6">
            <TabsPortalProvider container={portalNode}>
              <RouteGuard>{children}</RouteGuard>
            </TabsPortalProvider>
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  );
}
