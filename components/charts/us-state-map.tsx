"use client";

import * as React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { Tooltip as ReactTooltip } from "react-tooltip";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/* FIPS → state abbrev mapping for the states we care about */
const FIPS_TO_ABBREV: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

/* State abbreviation → full name */
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/* State center coordinates for markers */
const STATE_CENTERS: Record<string, [number, number]> = {
  TN: [-86.58, 35.86], OH: [-82.76, 40.39], IL: [-89.20, 40.06],
  MI: [-84.54, 43.33], NC: [-79.80, 35.63], TX: [-99.36, 31.05],
  SC: [-80.95, 33.86], IN: [-86.27, 39.85], KY: [-84.67, 37.67],
};

interface StateData {
  state: string;
  value: number;
  label?: string;
}

interface SiteMarker {
  name: string;
  coordinates: [number, number];
  type: "site" | "facility";
}

interface USStateMapProps {
  data: StateData[];
  markers?: SiteMarker[];
  valueFormatter?: (v: number) => string;
  colorScale?: { min: string; max: string };
}

export function USStateMap({
  data,
  markers = [],
  valueFormatter = (v) => v.toLocaleString(),
  colorScale = { min: "var(--color-primary-100)", max: "var(--color-primary-600)" },
}: USStateMapProps) {
  const [tooltipContent, setTooltipContent] = React.useState("");

  const dataMap = React.useMemo(() => {
    const map = new Map<string, StateData>();
    data.forEach((d) => map.set(d.state, d));
    return map;
  }, [data]);

  const maxVal = React.useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  function getColor(stateAbbrev: string): string {
    const d = dataMap.get(stateAbbrev);
    if (!d || d.value === 0) return "var(--color-bg-subtle)";
    const intensity = Math.max(0.15, d.value / maxVal);
    return `color-mix(in srgb, ${colorScale.max} ${Math.round(intensity * 100)}%, ${colorScale.min})`;
  }

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 900 }}
        width={780}
        height={450}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id as string;
              const abbrev = FIPS_TO_ABBREV[fips] ?? "";
              const d = dataMap.get(abbrev);
              return (
                <Geography
                  key={geo.rpiKey}
                  geography={geo}
                  fill={getColor(abbrev)}
                  stroke="var(--color-bg-card)"
                  strokeWidth={0.75}
                  data-tooltip-id="map-tooltip"
                  data-tooltip-content={
                    d
                      ? `${STATE_NAMES[abbrev] ?? abbrev}: ${valueFormatter(d.value)}${d.label ? ` · ${d.label}` : ""}`
                      : STATE_NAMES[abbrev] ?? abbrev
                  }
                  onMouseEnter={() => {
                    setTooltipContent(
                      d
                        ? `${STATE_NAMES[abbrev] ?? abbrev}: ${valueFormatter(d.value)}${d.label ? ` · ${d.label}` : ""}`
                        : STATE_NAMES[abbrev] ?? abbrev
                    );
                  }}
                  onMouseLeave={() => setTooltipContent("")}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", opacity: 0.8 },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Site / Facility markers — one per state, shows count */}
        {markers.map((m) => {
          const names = m.name.split(", ");
          const count = names.length;
          const color = m.type === "site" ? "var(--color-error-400)" : "var(--color-primary-400)";
          const label = m.type === "site" ? "Sites" : "Facilities";
          const tooltipText = `${label}: ${names.join(" · ")}`;
          return (
            <Marker key={`${m.type}-${m.name}`} coordinates={m.coordinates}>
              <circle
                r={count > 1 ? 7 : 4}
                fill={color}
                stroke="var(--color-bg-card)"
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                data-tooltip-id="map-tooltip"
                data-tooltip-content={tooltipText}
              />
              {count > 1 && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: 8, fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", fill: "#fff", pointerEvents: "none" }}
                >
                  {count}
                </text>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      <ReactTooltip
        id="map-tooltip"
        content={tooltipContent}
        style={{
          backgroundColor: "var(--color-bg-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 8,
          fontSize: 12,
          padding: "6px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      />

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <div className="flex items-center gap-1">
            <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, display: "block", backgroundColor: "var(--color-error-400)" }} />
            Sites
          </div>
          <div className="flex items-center gap-1">
            <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, display: "block", backgroundColor: "var(--color-primary-400)" }} />
            Facilities
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <span>Low</span>
          <div className="flex h-2 w-20 rounded overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: colorScale.min }} />
            <div className="flex-1" style={{ backgroundColor: `color-mix(in srgb, ${colorScale.max} 50%, ${colorScale.min})` }} />
            <div className="flex-1" style={{ backgroundColor: colorScale.max }} />
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
