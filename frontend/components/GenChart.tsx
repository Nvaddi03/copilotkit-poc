"use client";

/**
 * Generic, agent-driven chart. The LLM picks the `kind` and supplies the
 * data; we render with recharts. This is the L4 declarative-GenUI pattern:
 * the host app exposes ONE flexible "render-a-chart" capability and the
 * agent decides what to show.
 */

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const PALETTE = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
];

export type ChartKind =
  | "pie"
  | "donut"
  | "bar"
  | "hbar"
  | "line"
  | "area"
  | "scatter";

export type ChartDatum = {
  /** Category label (for pie / bar / line x-axis). */
  name: string;
  /** Primary numeric value. */
  value?: number;
  /** Optional extra numeric series — for multi-series bar/line/area, or y in scatter. */
  [key: string]: string | number | undefined;
};

export type GenChartSpec = {
  kind: ChartKind;
  title?: string;
  /** Y-axis label (line/bar/area/scatter). */
  yLabel?: string;
  /** X-axis label (line/bar/area/scatter). */
  xLabel?: string;
  data: ChartDatum[];
  /**
   * For multi-series charts. If omitted, we auto-detect numeric keys
   * other than `name` from the first row, falling back to "value".
   */
  series?: string[];
};

function detectSeries(data: ChartDatum[], explicit?: string[]): string[] {
  if (explicit && explicit.length) return explicit;
  if (!data?.length) return ["value"];
  const first = data[0];
  const keys = Object.keys(first).filter(
    (k) => k !== "name" && typeof first[k] === "number",
  );
  return keys.length ? keys : ["value"];
}

export function GenChart({ spec }: { spec: GenChartSpec }) {
  console.log("[GenChart] COMPONENT MOUNTED");
  const { kind, title, data, xLabel, yLabel } = spec;
  const series = detectSeries(data, spec.series);

  console.log("[GenChart] kind", kind, "title", title, "data", data, "series", series, "xLabel", xLabel, "yLabel", yLabel);

  const Wrap = (children: React.ReactNode) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {title && (
        <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
      )}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );

  switch (kind) {
    case "pie":
    case "donut":
      return Wrap(
        <PieChart>
          <Pie
            data={data}
            dataKey={series[0]}
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={kind === "donut" ? 55 : 0}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>,
      );

    case "bar":
      return Wrap(
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" label={xLabel ? { value: xLabel, position: "insideBottom", offset: -4 } : undefined} />
          <YAxis label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft" } : undefined} />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Bar key={s} dataKey={s} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </BarChart>,
      );

    case "hbar":
      return Wrap(
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={120} />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Bar key={s} dataKey={s} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </BarChart>,
      );

    case "line":
      return Wrap(
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>,
      );

    case "area":
      return Wrap(
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Area
              key={s}
              type="monotone"
              dataKey={s}
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.25}
            />
          ))}
        </AreaChart>,
      );

    case "scatter":
      return Wrap(
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" dataKey={series[0] ?? "x"} name={series[0]} />
          <YAxis type="number" dataKey={series[1] ?? "y"} name={series[1]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name={title ?? "series"} data={data} fill={PALETTE[0]} />
        </ScatterChart>,
      );

    default:
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Unknown chart kind: {String(kind)}
        </div>
      );
  }
}

export default GenChart;
