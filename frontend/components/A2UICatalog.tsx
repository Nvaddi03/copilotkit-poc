"use client";

import { GenPieChart, PieDatum } from "./PieChart";
import { GenChart, type GenChartSpec } from "./GenChart";

/**
 * A small "Agent-to-UI" catalog: the agent picks a component name + props,
 * and we render the matching React component. This is the foundation of
 * Declarative Generative UI (L4).
 */
export type A2UISpec =
  | { component: "Stat"; props: { label: string; value: string | number } }
  | { component: "Pie"; props: { title?: string; data: PieDatum[] } }
  | { component: "Chart"; props: GenChartSpec }
  | { component: "Table"; props: { columns: string[]; rows: (string | number)[][] } }
  | { component: "Callout"; props: { tone?: "info" | "success" | "warn"; text: string } };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-slate-50/50">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-slate-800">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({
  tone = "info",
  text,
}: {
  tone?: "info" | "success" | "warn";
  text: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-sky-50 text-sky-800 border-sky-200";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>{text}</div>
  );
}

export function A2UICatalog({ spec }: { spec: A2UISpec }) {
  console.log("[A2UICatalog] rendering", spec);
  switch (spec.component) {
    case "Stat":
      return <Stat {...spec.props} />;
    case "Pie":
      return <GenPieChart {...spec.props} />;
    case "Chart":
      return <GenChart spec={spec.props} />;
    case "Table":
      return <Table {...spec.props} />;
    case "Callout":
      return <Callout {...spec.props} />;
    default:
      return (
        <div className="text-sm text-rose-600">
          Unknown component: {(spec as any).component}
        </div>
      );
  }
}

export default A2UICatalog;
