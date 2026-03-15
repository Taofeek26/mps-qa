"use client";

import { ChartContainer } from "@/components/charts";
import { computeMarginHeatmap } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

function getCellColor(margin: number | null): string {
  if (margin === null) return "var(--color-bg-subtle)";
  if (margin > 0) return "var(--color-success-400)";
  if (margin < 0) return "var(--color-error-400)";
  return "var(--color-bg-subtle)";
}

function getCellTextColor(margin: number | null): string {
  if (margin === null) return "var(--color-text-muted)";
  if (margin > 0 || margin < 0) return "#fff";
  return "var(--color-text-muted)";
}

export function ChartMarginHeatmap({ shipments }: { shipments: Shipment[] }) {
  const { wasteTypes, rows } = computeMarginHeatmap(shipments);

  return (
    <ChartContainer title="Margin Heatmap" subtitle="Site x waste type margin matrix">
      <div className="overflow-auto" style={{ maxHeight: 300 }}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 text-left px-2 py-1.5 font-medium"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  color: "var(--color-text-muted)",
                  borderBottom: "1px solid var(--color-border-default)",
                }}
              >
                Site
              </th>
              {wasteTypes.map((wt) => (
                <th
                  key={wt}
                  className="px-2 py-1.5 font-medium text-center whitespace-nowrap"
                  style={{
                    color: "var(--color-text-muted)",
                    borderBottom: "1px solid var(--color-border-default)",
                  }}
                >
                  {wt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.site}>
                <td
                  className="sticky left-0 z-10 px-2 py-1.5 font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "var(--color-bg-card)",
                    color: "var(--color-text-primary)",
                    borderBottom: "1px solid var(--color-border-default)",
                  }}
                >
                  {row.site}
                </td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.wasteType}
                    className="px-2 py-1.5 text-center font-medium"
                    style={{
                      backgroundColor: getCellColor(cell.margin),
                      color: getCellTextColor(cell.margin),
                      borderBottom: "1px solid var(--color-border-default)",
                      borderRight: "1px solid var(--color-border-default)",
                    }}
                  >
                    {cell.margin !== null ? `$${cell.margin.toLocaleString()}` : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartContainer>
  );
}
