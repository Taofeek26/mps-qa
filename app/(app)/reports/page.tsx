"use client";

import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Scale,
  FileOutput,
  Banknote,
  Activity,
  ShieldCheck,
  ClipboardList,
  Route,
  Leaf,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const reports = [
  {
    title: "Waste Trends",
    description: "Volume trends over time, waste type breakdown, and treatment method analysis",
    href: "/reports/waste-trends",
    icon: TrendingUp,
    type: "Charts & Analytics",
  },
  {
    title: "Cost Analysis",
    description: "MPS cost vs customer cost, cost per ton trends, margin analysis, and rebate tracking",
    href: "/reports/cost-analysis",
    icon: DollarSign,
    type: "Charts & Analytics",
  },
  {
    title: "Light Load Report",
    description: "Identify underweight shipments and load efficiency opportunities",
    href: "/reports/light-load",
    icon: Scale,
    type: "Charts & Analytics",
  },
  {
    title: "Regulatory Exports",
    description: "Biennial Hazardous Waste, GEM (Ford), and GMR2 (GM) formatted data exports",
    href: "/reports/regulatory",
    icon: FileOutput,
    type: "Data Exports",
  },
  {
    title: "Financial Intelligence",
    description: "Margin heatmaps, cost waterfalls, rebate analysis, and cost efficiency quadrants",
    href: "/reports/financial",
    icon: Banknote,
    type: "Financial",
  },
  {
    title: "Operational Intelligence",
    description: "Site leaderboards, waste treemaps, transporter performance, and small multiples",
    href: "/reports/operations",
    icon: Activity,
    type: "Operations",
  },
  {
    title: "Data Quality",
    description: "Data health scorecard, missing codes, duplicate manifests, and compliance gaps",
    href: "/reports/data-quality",
    icon: ShieldCheck,
    type: "Governance",
  },
  {
    title: "Vendor Intelligence",
    description: "Vendor risk pyramid, DBE diversity spend, expiration timelines, and compliance matrix",
    href: "/reports/vendor-intelligence",
    icon: ClipboardList,
    type: "Governance",
  },
  {
    title: "Logistics & Facilities",
    description: "Waste flow networks, facility utilization, distance analysis, and receiving summaries",
    href: "/reports/logistics",
    icon: Route,
    type: "Operations",
  },
  {
    title: "GHG Emissions",
    description: "Greenhouse gas intensity trends, emissions by treatment method, and ESG reporting",
    href: "/reports/emissions",
    icon: Leaf,
    type: "ESG & Compliance",
  },
];

const typeVariant: Record<string, "neutral" | "success" | "warning" | "error"> = {
  "Charts & Analytics": "neutral",
  "Data Exports": "warning",
  Financial: "success",
  Operations: "neutral",
  Governance: "error",
  "ESG & Compliance": "success",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analytics dashboards, intelligence layers, and regulatory exports"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card interactive className="h-full">
              <CardContent className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary-400">
                  <report.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{report.title}</p>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{report.description}</p>
                  <div className="mt-2">
                    <Badge variant={typeVariant[report.type] ?? "neutral"}>
                      {report.type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
