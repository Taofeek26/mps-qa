import {
  LayoutDashboard,
  Truck,
  Building2,
  Users,
  ScrollText,
  Briefcase,
  TrendingUp,
  FileText,
  Factory,
  FileBarChart,
  Package,
  DollarSign,
  Scale,
  ShieldCheck,
  Activity,
  DatabaseZap,
  Globe,
  MapPin,
  Leaf,
  Monitor,
  Heart,
  type LucideIcon,
} from "lucide-react";

/* ─── Route config ─── */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only visible to these roles. Omit = visible to all. */
  roles?: string[];
  /** Expandable child links (rendered as a collapsible sub-menu) */
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Shipments", href: "/shipments", icon: Truck },
      {
        label: "Reports", href: "/reports", icon: TrendingUp,
        children: [
          { label: "Waste Trends", href: "/reports?tab=waste-trends", icon: Package },
          { label: "Cost Analysis", href: "/reports?tab=cost-analysis", icon: DollarSign },
          { label: "Light Load", href: "/reports?tab=light-load", icon: Scale },
          { label: "Regulatory", href: "/reports?tab=regulatory", icon: ShieldCheck },
          { label: "Operations", href: "/reports?tab=operations", icon: Activity },
          { label: "Data Quality", href: "/reports?tab=data-quality", icon: DatabaseZap },
          { label: "Vendor Intel", href: "/reports?tab=vendor-intel", icon: Globe },
          { label: "Logistics", href: "/reports?tab=logistics", icon: MapPin },
          { label: "Emissions", href: "/reports?tab=emissions", icon: Leaf },
          { label: "Platform Analytics", href: "/reports?tab=platform-analytics", icon: Monitor },
          { label: "Customer Experience", href: "/reports?tab=customer-experience", icon: Heart },
        ],
      },
      { label: "Report Builder", href: "/reports/builder", icon: FileBarChart },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Clients & Sites", href: "/admin/clients", icon: Briefcase, roles: ["admin"] },
      { label: "Vendors", href: "/admin/vendors", icon: Building2, roles: ["admin"] },
      { label: "Reference Data", href: "/admin/reference-data", icon: FileText, roles: ["admin"] },
      { label: "Facilities & Transport", href: "/admin/facilities", icon: Factory, roles: ["admin"] },
      { label: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, roles: ["admin", "manager"] },
    ],
  },
];

/* ─── Helpers ─── */

/** Get all nav items (flat) across groups */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];
  for (const group of NAV_GROUPS) {
    items.push(...group.items);
  }
  return items;
}

/* ─── Breadcrumb generation ─── */

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  new: "New Entry",
  admin: "Admin",
  reports: "Reports",
  builder: "Report Builder",
  clients: "Clients & Sites",
  vendors: "Vendors",
  "reference-data": "Reference Data",
  facilities: "Facilities & Transport",
  users: "Users",
  "audit-log": "Audit Log",
};

/** Maps tab query-param slugs to display labels for breadcrumbs */
const TAB_LABELS: Record<string, string> = {
  // Reports
  "waste-trends": "Waste Trends",
  "cost-analysis": "Cost Analysis",
  "light-load": "Light Load",
  regulatory: "Regulatory",
  financial: "Financial",
  operations: "Operations",
  "data-quality": "Data Quality",
  "vendor-intel": "Vendor Intel",
  logistics: "Logistics",
  emissions: "Emissions",
  "platform-analytics": "Platform Analytics",
  "customer-experience": "Customer Experience",
  // Admin > Clients & Sites
  clients: "Clients",
  sites: "Sites",
  // Admin > Reference Data
  "waste-types": "Waste Types",
  "source-codes": "Source Codes",
  "form-codes": "Form Codes",
  "treatment-codes": "Treatment Codes",
  "ewc-codes": "EWC Codes",
  "tri-codes": "TRI Codes",
  // Admin > Facilities & Transport
  "receiving-facilities": "Receiving Facilities",
  transporters: "Transporters",
  "service-items": "Service Items",
  containers: "Containers",
  profiles: "Profiles",
};

/** Default tab for routes that use tabbed navigation */
const DEFAULT_TABS: Record<string, string> = {
  "/reports": "waste-trends",
  "/admin/clients": "clients",
  "/admin/reference-data": "waste-types",
  "/admin/facilities": "receiving-facilities",
};

export function buildBreadcrumbs(pathname: string, tab?: string | null): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const resolvedTab = tab || DEFAULT_TABS[pathname] || null;

  const crumbs: BreadcrumbSegment[] = [];
  let path = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const label = ROUTE_LABELS[segment] ?? segment;
    const isLast = i === segments.length - 1 && !resolvedTab;

    crumbs.push({ label, href: isLast ? undefined : path });
  }

  if (resolvedTab) {
    const tabLabel = TAB_LABELS[resolvedTab] ?? resolvedTab.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label: tabLabel });
  }

  return crumbs;
}
