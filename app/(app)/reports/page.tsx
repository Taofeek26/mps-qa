"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useQueryState, parseAsString } from "nuqs";
import {
  Package,
  DollarSign,
  Scale,
  ShieldCheck,
  Activity,
  DatabaseZap,
  Globe,
  MapPin,
  Leaf,
  FileBarChart,
  ChevronRight,
  ArrowLeft,
  Monitor,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { WasteTrendsContent } from "./_components/waste-trends-content";
import { CostAnalysisContent } from "./_components/cost-analysis-content";
import { LightLoadContent } from "./_components/light-load-content";
import { RegulatoryContent } from "./_components/regulatory-content";
import { OperationsContent } from "./_components/operations-content";
import { DataQualityContent } from "./_components/data-quality-content";
import { VendorIntelContent } from "./_components/vendor-intel-content";
import { LogisticsContent } from "./_components/logistics-content";
import { EmissionsContent } from "./_components/emissions-content";
import { PlatformAnalyticsContent } from "./_components/platform-analytics-content";
import { CustomerExperienceContent } from "./_components/customer-experience-content";

const REPORT_CONTENT: Record<string, React.ComponentType> = {
  "waste-trends": WasteTrendsContent,
  "cost-analysis": CostAnalysisContent,
  "light-load": LightLoadContent,
  regulatory: RegulatoryContent,
  operations: OperationsContent,
  "data-quality": DataQualityContent,
  "vendor-intel": VendorIntelContent,
  logistics: LogisticsContent,
  emissions: EmissionsContent,
  "platform-analytics": PlatformAnalyticsContent,
  "customer-experience": CustomerExperienceContent,
};

interface ReportListItem {
  tab: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
}

const REPORT_LIST: ReportListItem[] = [
  { tab: "waste-trends", label: "Waste Trends", description: "Volume, containers, and waste stream analysis", icon: Package },
  { tab: "cost-analysis", label: "Cost Analysis", description: "Cost breakdown, margins, and financial trends", icon: DollarSign },
  { tab: "light-load", label: "Light Load", description: "Under-loaded shipments and optimization", icon: Scale },
  { tab: "regulatory", label: "Regulatory", description: "Compliance, GEM, GMR2, and biennial reports", icon: ShieldCheck },
  { tab: "operations", label: "Operations", description: "Turnaround, throughput, and leaderboards", icon: Activity },
  { tab: "data-quality", label: "Data Quality", description: "Missing fields, anomalies, and data health", icon: DatabaseZap },
  { tab: "vendor-intel", label: "Vendor Intel", description: "Vendor performance, risk, and scoring", icon: Globe },
  { tab: "logistics", label: "Logistics", description: "Route analysis, distance, and carrier metrics", icon: MapPin },
  { tab: "emissions", label: "Emissions", description: "Carbon footprint and environmental impact", icon: Leaf },
  { tab: "platform-analytics", label: "Platform Analytics", description: "User adoption, feature usage, and system utilization", icon: Monitor },
  { tab: "customer-experience", label: "Customer Experience", description: "CSAT, NPS, response times, and complaint tracking", icon: Heart },
  { tab: "_builder", label: "Report Builder", description: "Build custom reports with drag-and-drop widgets", icon: FileBarChart, href: "/reports/builder" },
];

function ReportsContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString);

  // Mobile: no tab selected → show report list
  // Desktop: always show report content (default to waste-trends)
  if (!tab) {
    return (
      <>
        {/* Desktop: show default report */}
        <div className="hidden sm:block">
          <WasteTrendsContent />
        </div>

        {/* Mobile: show report list */}
        <div className="sm:hidden">
          <MobileReportList />
        </div>
      </>
    );
  }

  const Content = REPORT_CONTENT[tab] ?? WasteTrendsContent;

  return (
    <>
      {/* Mobile: back button */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setTab(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary active:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All Reports
        </button>
      </div>
      <Content />
    </>
  );
}

function MobileReportList() {
  return (
    <div className="-mx-4 bg-bg-card">
      {REPORT_LIST.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === REPORT_LIST.length - 1;
        return (
          <Link
            key={item.tab}
            href={item.href ?? `/reports?tab=${item.tab}`}
            className="flex items-center gap-3 pl-4 transition-colors active:bg-bg-subtle"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-success-400/20 border border-success-400/30 text-success-600">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className={cn(
              "flex flex-1 items-center gap-3 py-4 pr-4 mr-4 min-w-0",
              !isLast && "border-b border-border-strong"
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted truncate">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
