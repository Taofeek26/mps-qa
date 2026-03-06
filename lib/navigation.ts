import {
  LayoutDashboard,
  Truck,
  Building2,
  MapPin,
  Trash2,
  Users,
  ScrollText,
  Briefcase,
  TrendingUp,
  DollarSign,
  Scale,
  FileOutput,
  Wrench,
  Box,
  FileText,
  Factory,
  Banknote,
  Activity,
  ShieldCheck,
  ClipboardList,
  Route,
  Leaf,
  type LucideIcon,
} from "lucide-react";

/* ─── Route config ─── */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only visible to these roles. Omit = visible to all. */
  roles?: string[];
}

export interface NavSubGroup {
  label: string;
  items: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  subGroups?: NavSubGroup[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Shipments", href: "/shipments", icon: Truck },
    ],
  },
  {
    label: "Reports",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { label: "Waste Trends", href: "/reports/waste-trends", icon: TrendingUp },
      { label: "Cost Analysis", href: "/reports/cost-analysis", icon: DollarSign },
      { label: "Light Load", href: "/reports/light-load", icon: Scale },
      { label: "Regulatory", href: "/reports/regulatory", icon: FileOutput },
      { label: "Financial", href: "/reports/financial", icon: Banknote },
      { label: "Operations", href: "/reports/operations", icon: Activity },
      { label: "Data Quality", href: "/reports/data-quality", icon: ShieldCheck },
      { label: "Vendor Intel", href: "/reports/vendor-intelligence", icon: ClipboardList },
      { label: "Logistics", href: "/reports/logistics", icon: Route },
      { label: "Emissions", href: "/reports/emissions", icon: Leaf },
    ],
  },
  {
    label: "Admin",
    collapsible: true,
    defaultExpanded: false,
    items: [],
    subGroups: [
      {
        label: "Master Data",
        items: [
          { label: "Clients", href: "/admin/clients", icon: Briefcase, roles: ["system_admin"] },
          { label: "Sites", href: "/admin/sites", icon: MapPin, roles: ["system_admin"] },
          { label: "Vendors", href: "/admin/vendors", icon: Building2, roles: ["system_admin"] },
          { label: "Waste Types", href: "/admin/waste-types", icon: Trash2, roles: ["system_admin"] },
          { label: "Service Items", href: "/admin/service-items", icon: Wrench, roles: ["system_admin"] },
          { label: "Containers", href: "/admin/containers", icon: Box, roles: ["system_admin"] },
          { label: "Profiles", href: "/admin/profiles", icon: FileText, roles: ["system_admin"] },
        ],
      },
      {
        label: "Operations",
        items: [
          { label: "Receiving Facilities", href: "/admin/receiving-facilities", icon: Factory, roles: ["system_admin"] },
          { label: "Transporters", href: "/admin/transporters", icon: Truck, roles: ["system_admin"] },
          { label: "Users", href: "/admin/users", icon: Users, roles: ["system_admin"] },
        ],
      },
      {
        label: "System",
        items: [
          { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, roles: ["admin", "system_admin"] },
        ],
      },
    ],
  },
];

/* ─── Helpers ─── */

/** Get all nav items (flat) across groups and subgroups */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];
  for (const group of NAV_GROUPS) {
    items.push(...group.items);
    if (group.subGroups) {
      for (const sub of group.subGroups) {
        items.push(...sub.items);
      }
    }
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
  vendors: "Vendors",
  sites: "Sites",
  "waste-types": "Waste Types",
  clients: "Clients",
  users: "Users",
  "audit-log": "Audit Log",
  "service-items": "Service Items",
  containers: "Containers",
  profiles: "Profiles",
  "receiving-facilities": "Receiving Facilities",
  transporters: "Transporters",
  reports: "Reports",
  "waste-trends": "Waste Trends",
  "cost-analysis": "Cost Analysis",
  "light-load": "Light Load",
  regulatory: "Regulatory Exports",
  financial: "Financial Intelligence",
  operations: "Operational Intelligence",
  "data-quality": "Data Quality",
  "vendor-intelligence": "Vendor Intelligence",
  logistics: "Logistics & Facilities",
  emissions: "GHG Emissions",
};

export function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: BreadcrumbSegment[] = [];
  let path = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const label = ROUTE_LABELS[segment] ?? segment;
    const isLast = i === segments.length - 1;

    crumbs.push({ label, href: isLast ? undefined : path });
  }

  return crumbs;
}
