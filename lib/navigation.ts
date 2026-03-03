import {
  LayoutDashboard,
  Truck,
  Building2,
  MapPin,
  Trash2,
  Users,
  ScrollText,
  Briefcase,
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
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: Building2, roles: ["system_admin"] },
      { label: "Sites", href: "/admin/sites", icon: MapPin, roles: ["system_admin"] },
      { label: "Waste Types", href: "/admin/waste-types", icon: Trash2, roles: ["system_admin"] },
      { label: "Clients", href: "/admin/clients", icon: Briefcase, roles: ["system_admin"] },
      { label: "Users", href: "/admin/users", icon: Users, roles: ["system_admin"] },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, roles: ["admin", "system_admin"] },
    ],
  },
];

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
