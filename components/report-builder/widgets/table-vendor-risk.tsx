"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { computeVendorRisk } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";

function fmt(v: number): string {
  return "$" + v.toLocaleString();
}

const RISK_COLORS: Record<string, string> = {
  "Level 1 - High": "#dc2626",
  "Level 2 - Medium": "#d97706",
  "Level 3 - Low": "#16a34a",
};

function riskLabel(risk: string): string {
  if (risk.includes("High")) return "High";
  if (risk.includes("Medium")) return "Medium";
  return "Low";
}

export function TableVendorRisk({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const allData = computeVendorRisk(shipments);
  const limit = config.tableRowLimit ?? 25;
  const data = allData.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Vendor Risk Matrix</CardTitle>
        <p className="text-xs text-text-muted">
          Showing {data.length} of {allData.length} vendors
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 text-left font-medium text-text-muted">Vendor</th>
                <th className="px-3 py-2 text-left font-medium text-text-muted">Risk</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Shipments</th>
                <th className="px-3 py-2 text-right font-medium text-text-muted">Cost ($)</th>
                <th className="px-3 py-2 text-center font-medium text-text-muted">DBE</th>
                <th className="px-3 py-2 text-left font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.vendor} className="border-b border-border-default last:border-0">
                  <td className="px-3 py-2 text-text-primary font-medium">{row.vendor}</td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: RISK_COLORS[row.risk] ?? "#6b7280" }}
                    >
                      {riskLabel(row.risk)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{row.shipments}</td>
                  <td className="px-3 py-2 text-right text-text-secondary tabular-nums">{fmt(row.cost)}</td>
                  <td className="px-3 py-2 text-center">
                    {row.dbe ? (
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#16a34a" }} />
                    ) : (
                      <span className="text-text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
