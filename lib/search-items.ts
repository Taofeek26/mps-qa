import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  Briefcase,
  Building2,
  Package,
  Users,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS } from "@/lib/navigation";
import type {
  Shipment,
  Client,
  Site,
  Vendor,
  WasteType,
  User,
} from "@/lib/types";

/* ─── Types ─── */

export type SearchItemColor = "primary" | "success" | "warning" | "info";

/* ─── Color helpers (shared across command-palette & mobile topbar) ─── */

export const COLOR_CLASSES: Record<SearchItemColor, { bg: string; text: string; border: string }> = {
  primary: { bg: "bg-primary-400/15", text: "text-primary-500", border: "border-primary-400/25" },
  success: { bg: "bg-success-400/15", text: "text-success-600", border: "border-success-400/25" },
  warning: { bg: "bg-warning-400/15", text: "text-warning-600", border: "border-warning-400/25" },
  info: { bg: "bg-info-400/15", text: "text-info-600", border: "border-info-400/25" },
};

export interface SearchItem {
  id: string;
  label: string;
  description?: string;
  group: string;
  href: string;
  icon?: LucideIcon;
  keywords?: string[];
  type: "page" | "data";
  color?: SearchItemColor;
}

/* ─── Report tabs (static) ─── */

const REPORT_TABS: SearchItem[] = [
  { id: "report-waste-trends", label: "Waste Trends", group: "Reports", href: "/reports?tab=waste-trends", keywords: ["waste", "trends", "volume"], type: "page" },
  { id: "report-cost-analysis", label: "Cost Analysis", group: "Reports", href: "/reports?tab=cost-analysis", keywords: ["cost", "revenue", "margin", "financial"], type: "page" },
  { id: "report-light-load", label: "Light Load", group: "Reports", href: "/reports?tab=light-load", keywords: ["light", "load", "underweight"], type: "page" },
  { id: "report-regulatory", label: "Regulatory", group: "Reports", href: "/reports?tab=regulatory", keywords: ["regulatory", "compliance", "rcra"], type: "page" },
  { id: "report-operations", label: "Operations", group: "Reports", href: "/reports?tab=operations", keywords: ["operations", "vendors", "sites"], type: "page" },
  { id: "report-data-quality", label: "Data Quality", group: "Reports", href: "/reports?tab=data-quality", keywords: ["data", "quality", "errors"], type: "page" },
  { id: "report-vendor-intel", label: "Vendor Intel", group: "Reports", href: "/reports?tab=vendor-intel", keywords: ["vendor", "intel", "performance"], type: "page" },
  { id: "report-logistics", label: "Logistics", group: "Reports", href: "/reports?tab=logistics", keywords: ["logistics", "transport", "miles"], type: "page" },
  { id: "report-emissions", label: "Emissions", group: "Reports", href: "/reports?tab=emissions", keywords: ["emissions", "ghg", "sustainability", "carbon"], type: "page" },
];

/* ─── Role helpers ─── */

const ADMIN_ROLES = ["admin"];

function hasRole(userRole: string | undefined, allowed: string[]): boolean {
  return !!userRole && allowed.includes(userRole);
}

/* ─── Formatters ─── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  operator: "Operator",
  viewer: "Viewer",
};

/* ─── Data interface for builder ─── */

export interface SearchDataParams {
  shipments: Shipment[];
  clients: Client[];
  sites: Site[];
  vendors: Vendor[];
  wasteTypes: WasteType[];
  users: User[];
}

/* ─── Builder ─── */

export function buildAllSearchItems(
  userRole?: string,
  data?: SearchDataParams
): SearchItem[] {
  const items: SearchItem[] = [];

  // 1. Navigation pages
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.roles && userRole && !item.roles.includes(userRole)) continue;
      if (item.roles && !userRole) continue;
      items.push({
        id: `nav-${item.href}`,
        label: item.label,
        group: group.label,
        href: item.href,
        icon: item.icon,
        keywords: [item.label.toLowerCase()],
        type: "page",
      });
    }
  }

  // 2. Report tabs
  items.push(...REPORT_TABS);

  // If no data provided, return only navigation items
  if (!data) return items;

  // 3. Shipments
  for (const s of data.shipments) {
    items.push({
      id: `shipment-${s.id}`,
      label: `${s.id} · ${s.wasteTypeName}`,
      description: `${s.clientName} · ${s.siteName} · ${formatDate(s.shipmentDate)}`,
      group: "Shipments",
      href: `/shipments?search=${encodeURIComponent(s.id)}`,
      icon: Truck,
      color: "primary",
      keywords: [
        s.id, s.clientName, s.siteName, s.vendorName, s.wasteTypeName,
        s.manifestNumber ?? "", s.status,
      ].map((k) => k.toLowerCase()),
      type: "data",
    });
  }

  // 4. Clients
  for (const c of data.clients) {
    items.push({
      id: `client-${c.id}`,
      label: c.name,
      description: c.industry ?? undefined,
      group: "Clients",
      href: "/admin/clients",
      icon: Briefcase,
      color: "success",
      keywords: [c.name, c.industry ?? "", c.contactPerson ?? ""].map((k) => k.toLowerCase()),
      type: "data",
    });
  }

  // 5. Sites
  const clientMap = new Map(data.clients.map((c) => [c.id, c.name]));
  for (const s of data.sites) {
    const clientName = clientMap.get(s.clientId) ?? "";
    items.push({
      id: `site-${s.id}`,
      label: s.name,
      description: [clientName, s.state].filter(Boolean).join(" · ") || undefined,
      group: "Sites",
      href: "/admin/clients?tab=sites",
      icon: Briefcase,
      color: "success",
      keywords: [s.name, s.city ?? "", s.state ?? "", s.address ?? "", clientName].map((k) => k.toLowerCase()),
      type: "data",
    });
  }

  // 6. Vendors (admin only)
  if (hasRole(userRole, ADMIN_ROLES)) {
    for (const v of data.vendors) {
      items.push({
        id: `vendor-${v.id}`,
        label: v.name,
        description: [v.vendorType, [v.city, v.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || undefined,
        group: "Vendors",
        href: "/admin/vendors",
        icon: Building2,
        color: "warning",
        keywords: [v.name, v.vendorCode ?? "", v.vendorType ?? "", v.city ?? "", v.state ?? ""].map((k) => k.toLowerCase()),
        type: "data",
      });
    }
  }

  // 7. Waste Types
  for (const w of data.wasteTypes) {
    items.push({
      id: `waste-${w.id}`,
      label: w.name,
      description: [w.wasteCategory, w.defaultTreatmentMethod].filter(Boolean).join(" · ") || undefined,
      group: "Waste Types",
      href: "/admin/reference-data?tab=waste-types",
      icon: Package,
      color: "info",
      keywords: [w.name, w.wasteCategory ?? "", w.defaultTreatmentMethod ?? ""].map((k) => k.toLowerCase()),
      type: "data",
    });
  }

  // 8. Users (admin only)
  if (hasRole(userRole, ADMIN_ROLES)) {
    for (const u of data.users) {
      items.push({
        id: `user-${u.id}`,
        label: u.displayName,
        description: [u.email, ROLE_LABELS[u.role] ?? u.role].filter(Boolean).join(" · ") || undefined,
        group: "Users",
        href: "/admin/users",
        icon: Users,
        color: "primary",
        keywords: [u.displayName, u.email, u.role].map((k) => k.toLowerCase()),
        type: "data",
      });
    }
  }

  return items;
}
