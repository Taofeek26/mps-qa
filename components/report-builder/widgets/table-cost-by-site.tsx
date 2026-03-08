"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { computeCostBySite } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";

function fmt(v: number): string {
  return "$" + v.toLocaleString();
}

export function TableCostBySite({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const allData = computeCostBySite(shipments);
  const limit = config.tableRowLimit ?? 25;
  const data = allData.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Cost Breakdown by Site</CardTitle>
        <p className="text-xs text-text-muted">
          Showing {data.length} of {allData.length} sites
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 text-left font-medium text-text-muted">Site</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Revenue</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">MPS Cost</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Margin</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Tons</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Shipments</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.site} className="border-b border-border-default last:border-0">
                  <td className="px-3 py-2 text-text-primary font-medium">{row.site}</td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{fmt(row.revenue)}</td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{fmt(row.cost)}</td>
                  <td className={`px-3 py-2 text-right font-medium tabular-nums ${row.margin >= 0 ? "text-success-600" : "text-error-600"}`}>
                    {fmt(row.margin)}
                  </td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.tons.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.shipments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
