"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Tabs as RadixTabs } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * Context for rendering TabsList outside the page content area.
 * The app shell provides a DOM node between the topbar and main.
 */
const TabsPortalContext = React.createContext<HTMLElement | null>(null);

function TabsPortalProvider({
  children,
  container,
}: {
  children: React.ReactNode;
  container: HTMLElement | null;
}) {
  return (
    <TabsPortalContext.Provider value={container}>
      {children}
    </TabsPortalContext.Provider>
  );
}

const Tabs = RadixTabs.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => {
  const portalContainer = React.useContext(TabsPortalContext);
  const listRef = React.useRef<HTMLDivElement>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);
  const hasAnimatedRef = React.useRef(false);

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;
    const activeTab = list.querySelector<HTMLElement>("[data-state=active]");
    if (!activeTab) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const left = tabRect.left - listRect.left;
    const width = tabRect.width;

    if (!hasAnimatedRef.current) {
      // First measurement — position without transition
      indicator.style.transition = "none";
      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
      requestAnimationFrame(() => {
        hasAnimatedRef.current = true;
        if (indicatorRef.current) {
          indicatorRef.current.style.transition = "left 200ms ease, width 200ms ease";
        }
      });
    } else {
      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
    }
  }, []);

  React.useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new MutationObserver(updateIndicator);
    observer.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, [updateIndicator]);

  const content = (
    <div className="relative bg-bg-card border-b border-border-default">
      <RadixTabs.List
        ref={(node) => {
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "relative flex items-center gap-1 px-4 lg:px-6",
          className
        )}
        {...props}
      />
      <div
        ref={indicatorRef}
        className="absolute bottom-0 h-0.5 bg-primary-400 rounded-full"
      />
    </div>
  );

  if (portalContainer) {
    return createPortal(content, portalContainer);
  }

  return content;
});
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-text-muted transition-colors duration-150 cursor-pointer",
      "hover:text-text-primary",
      "data-[state=active]:text-primary-400 data-[state=active]:font-semibold",
      "focus-ring rounded-t-[var(--radius-sm)]",
      "disabled:pointer-events-none disabled:opacity-40",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsPortalProvider };
