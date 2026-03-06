"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  category?: string;
}

export interface ScatterQuadrantProps {
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  /** Quadrant divider on X axis. Defaults to median of data x values. */
  xThreshold?: number;
  /** Quadrant divider on Y axis. Defaults to median of data y values. */
  yThreshold?: number;
  /** Labels for each quadrant: [top-left, top-right, bottom-left, bottom-right] */
  quadrantLabels?: [string, string, string, string];
  /** Render a diagonal y=x reference line. */
  showDiagonal?: boolean;
  /** Map category string to a color value. */
  categoryColors?: Record<string, string>;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
  tooltipFormatter?: (point: ScatterPoint) => string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* -------------------------------------------------------------------------- */
/*  Custom Tooltip                                                            */
/* -------------------------------------------------------------------------- */

function buildTooltipContent(
  xLabel: string,
  yLabel: string,
  xFormatter: (v: number) => string,
  yFormatter: (v: number) => string,
  tooltipFormatter?: (point: ScatterPoint) => string,
) {
  function ScatterTooltipContent({ active, payload }: TooltipContentProps<number, string>) {
    if (!active || !payload || payload.length === 0) return null;

    const raw = payload[0]?.payload as ScatterPoint | undefined;
    if (!raw) return null;

    if (tooltipFormatter) {
      return (
        <div style={TOOLTIP_STYLE.contentStyle}>
          <p>{tooltipFormatter(raw)}</p>
        </div>
      );
    }

    return (
      <div style={TOOLTIP_STYLE.contentStyle}>
        {raw.label && (
          <p style={{ ...TOOLTIP_STYLE.labelStyle, marginTop: 0 }}>
            {raw.label}
          </p>
        )}
        <p style={{ margin: "2px 0" }}>
          {xLabel}: {xFormatter(raw.x)}
        </p>
        <p style={{ margin: "2px 0" }}>
          {yLabel}: {yFormatter(raw.y)}
        </p>
      </div>
    );
  }

  ScatterTooltipContent.displayName = "ScatterTooltipContent";
  return ScatterTooltipContent;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function ScatterQuadrant({
  data,
  xLabel = "X",
  yLabel = "Y",
  xThreshold: xThresholdProp,
  yThreshold: yThresholdProp,
  quadrantLabels,
  showDiagonal = false,
  categoryColors,
  xFormatter = (v) => String(v),
  yFormatter = (v) => String(v),
  tooltipFormatter,
}: ScatterQuadrantProps) {
  const xThreshold = xThresholdProp ?? median(data.map((d) => d.x));
  const yThreshold = yThresholdProp ?? median(data.map((d) => d.y));

  // Compute axis domains with padding
  const { xDomain, yDomain, diagonalData } = useMemo(() => {
    if (data.length === 0) {
      return {
        xDomain: [0, 100] as [number, number],
        yDomain: [0, 100] as [number, number],
        diagonalData: [] as Array<{ x: number; y: number }>,
      };
    }

    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xPad = (xMax - xMin) * 0.1 || 10;
    const yPad = (yMax - yMin) * 0.1 || 10;

    const domainXMin = Math.max(0, Math.floor(xMin - xPad));
    const domainXMax = Math.ceil(xMax + xPad);
    const domainYMin = Math.max(0, Math.floor(yMin - yPad));
    const domainYMax = Math.ceil(yMax + yPad);

    const diagMax = Math.max(domainXMax, domainYMax);
    const diagData = [
      { x: 0, y: 0 },
      { x: diagMax, y: diagMax },
    ];

    return {
      xDomain: [domainXMin, domainXMax] as [number, number],
      yDomain: [domainYMin, domainYMax] as [number, number],
      diagonalData: diagData,
    };
  }, [data]);

  // Resolve point color
  function getPointColor(point: ScatterPoint): string {
    if (categoryColors && point.category && categoryColors[point.category]) {
      return categoryColors[point.category];
    }
    if (point.category) {
      // Assign deterministic color based on unique categories
      const categories = [...new Set(data.map((d) => d.category).filter(Boolean))];
      const catIndex = categories.indexOf(point.category);
      return CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length];
    }
    return CATEGORY_COLORS[0];
  }

  const CustomTooltip = useMemo(
    () => buildTooltipContent(xLabel, yLabel, xFormatter, yFormatter, tooltipFormatter),
    [xLabel, yLabel, xFormatter, yFormatter, tooltipFormatter],
  );

  const axisTickStyle = {
    fontSize: 11,
    fill: "var(--color-text-muted)",
  };

  const refLineStyle = {
    stroke: "var(--color-text-muted)",
    strokeDasharray: "3 3",
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        margin={{ top: 24, right: 24, bottom: 8, left: 8 }}
      >
        <CartesianGrid
          stroke="var(--color-border-default)"
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey="x"
          type="number"
          domain={xDomain}
          name={xLabel}
          tick={axisTickStyle}
          tickFormatter={xFormatter}
          label={{
            value: xLabel,
            position: "insideBottomRight",
            offset: -4,
            style: { fontSize: 12, fill: "var(--color-text-muted)" },
          }}
        />

        <YAxis
          dataKey="y"
          type="number"
          domain={yDomain}
          name={yLabel}
          tick={axisTickStyle}
          tickFormatter={yFormatter}
          label={{
            value: yLabel,
            angle: -90,
            position: "insideTopLeft",
            offset: 4,
            style: { fontSize: 12, fill: "var(--color-text-muted)" },
          }}
        />

        <ZAxis range={[48, 48]} />

        <Tooltip
          content={CustomTooltip}
          cursor={{ strokeDasharray: "3 3" }}
        />

        {/* Quadrant divider lines */}
        <ReferenceLine
          x={xThreshold}
          {...refLineStyle}
          label={
            quadrantLabels
              ? undefined
              : {
                  value: xFormatter(xThreshold),
                  position: "top",
                  style: { fontSize: 10, fill: "var(--color-text-muted)" },
                }
          }
        />
        <ReferenceLine
          y={yThreshold}
          {...refLineStyle}
          label={
            quadrantLabels
              ? undefined
              : {
                  value: yFormatter(yThreshold),
                  position: "right",
                  style: { fontSize: 10, fill: "var(--color-text-muted)" },
                }
          }
        />

        {/* Quadrant labels rendered as reference-line annotations */}
        {quadrantLabels && (
          <>
            {/* Top-left */}
            <ReferenceLine
              x={(xDomain[0] + xThreshold) / 2}
              stroke="none"
              label={{
                value: quadrantLabels[0],
                position: "top",
                style: {
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                  fontWeight: 500,
                },
              }}
            />
            {/* Top-right */}
            <ReferenceLine
              x={(xThreshold + xDomain[1]) / 2}
              stroke="none"
              label={{
                value: quadrantLabels[1],
                position: "top",
                style: {
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                  fontWeight: 500,
                },
              }}
            />
            {/* Bottom-left */}
            <ReferenceLine
              x={(xDomain[0] + xThreshold) / 2}
              stroke="none"
              label={{
                value: quadrantLabels[2],
                position: "bottom",
                style: {
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                  fontWeight: 500,
                },
              }}
            />
            {/* Bottom-right */}
            <ReferenceLine
              x={(xThreshold + xDomain[1]) / 2}
              stroke="none"
              label={{
                value: quadrantLabels[3],
                position: "bottom",
                style: {
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                  fontWeight: 500,
                },
              }}
            />
          </>
        )}

        {/* Diagonal y=x reference line */}
        {showDiagonal && (
          <Line
            data={diagonalData}
            dataKey="y"
            type="linear"
            stroke="var(--color-text-muted)"
            strokeDasharray="6 4"
            strokeWidth={1}
            dot={false}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
          />
        )}

        {/* Scatter points */}
        <Scatter data={data} isAnimationActive={false}>
          {data.map((point, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getPointColor(point)}
              fillOpacity={0.85}
            />
          ))}
        </Scatter>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
