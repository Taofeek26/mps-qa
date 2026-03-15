"use client";

import { ResponsiveContainer, Treemap } from "recharts";
import { ChartContainer, CATEGORY_COLORS } from "@/components/charts";
import { computeTreemapData } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

const TREEMAP_TEXT_STYLE = {
  fontWeight: 400,
  fontFamily: "Inter, system-ui, sans-serif",
  letterSpacing: "0.03em",
  textRendering: "geometricPrecision" as const,
};

export function ChartTreemap({ shipments }: { shipments: Shipment[] }) {
  const data = computeTreemapData(shipments);

  return (
    <ChartContainer title="Waste Treemap" subtitle="Proportional volume by waste type (lbs)">
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          stroke="var(--color-border-default)"
          isAnimationActive={false}
          content={({ x, y, width, height, name, index }: { x: number; y: number; width: number; height: number; name: string; index: number }) => {
            if (width < 2 || height < 2) return <g />;
            const showBoth = width > 45 && height > 32;
            const showName = width > 30 && height > 18;
            const val = data[index]?.size ?? 0;
            return (
              <g>
                <rect
                  x={x} y={y} width={width} height={height} rx={4}
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  stroke="var(--color-bg-card)" strokeWidth={2}
                />
                {showBoth ? (
                  <>
                    <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill="#fff" fontSize={Math.min(12, width / 6)} style={TREEMAP_TEXT_STYLE}>{name}</text>
                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(10, width / 7)} style={TREEMAP_TEXT_STYLE}>{(val / 1000).toFixed(1)}k lbs</text>
                  </>
                ) : showName ? (
                  <text x={x + width / 2} y={y + height / 2 + 1} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(10, width / 5)} style={TREEMAP_TEXT_STYLE}>{name}</text>
                ) : null}
              </g>
            );
          }}
        />
      </ResponsiveContainer>
    </ChartContainer>
  );
}
