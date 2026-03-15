"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { computeQualityBreakdown } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";

function statusBadge(rate: number): { label: string; className: string } {
  if (rate < 5) return { label: "Good", className: "bg-success-100 text-success-700" };
  if (rate <= 15) return { label: "Attention", className: "bg-warning-100 text-warning-700" };
  return { label: "Critical", className: "bg-error-100 text-error-700" };
}

export function TableQualityBreakdown({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const allData = computeQualityBreakdown(shipments);
  const limit = config.tableRowLimit ?? 25;
  const data = allData.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Data Quality Breakdown</CardTitle>
        <p className="text-xs text-text-muted">
          Showing {data.length} of {allData.length} checks
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 text-left font-medium text-text-muted">Check</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Issues</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Total</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Rate %</th>
                <th className="px-3 py-2 text-left font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const badge = statusBadge(row.rate);
                return (
                  <tr key={row.check} className="border-b border-border-default last:border-0">
                    <td className="px-3 py-2 text-text-primary font-medium">{row.check}</td>
                    <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.issues}</td>
                    <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.total}</td>
                    <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.rate}%</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
