"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { DOMAINS, type DomainKey } from "../lib/copilot-config";
import { GenPieChart, type PieDatum } from "../components/PieChart";
import { GenChart, type GenChartSpec, type ChartKind } from "../components/GenChart";

type Summary = Record<string, number | string>;
type ChartSpec = { title: string; data: PieDatum[] };

export default function DashboardPage() {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("finance");
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [genCharts, setGenCharts] = useState<GenChartSpec[]>([]);

  // Make the dashboard state readable by the Copilot.
  useCopilotReadable({
    description:
      "Currently selected business domain and the latest per-domain summaries displayed on the dashboard.",
    value: { activeDomain, summaries },
  });

  // Let the Copilot switch domains in the UI from chat.
  useCopilotAction({
    name: "selectDomain",
    description:
      "Switch the active business domain shown on the dashboard. One of: finance, hr, healthcare, wireless.",
    parameters: [
      {
        name: "domain",
        type: "string",
        description: "Domain key: finance | hr | healthcare | wireless",
        required: true,
      },
    ],
    handler: async ({ domain }) => {
      const d = String(domain).toLowerCase() as DomainKey;
      if (DOMAINS.some((x) => x.key === d)) setActiveDomain(d);
      return `Active domain is now ${d}`;
    },
  });

  // Let the Copilot push a summary into the dashboard from a tool result.
  useCopilotAction({
    name: "renderDomainSummary",
    description:
      "Display a key/value summary card for a given domain on the dashboard.",
    parameters: [
      { name: "domain", type: "string", required: true },
      { name: "summary", type: "object", required: true },
    ],
    handler: async ({ domain, summary }) => {
      setSummaries((s) => ({ ...s, [domain]: summary as Summary }));
      return `Updated summary for ${domain}`;
    },
  });

  // Render a pie chart on the dashboard. Use this whenever the user asks
  // for a chart, breakdown, distribution, "visualize", "show as pie", etc.
  useCopilotAction({
    name: "showPieChart",
    description:
      "Render a pie chart on the dashboard. Call this whenever the user asks to visualize, chart, plot, graph, show distribution or breakdown of any numeric data. Provide a short title and an array of {name, value} slices (numbers, not strings).",
    parameters: [
      { name: "title", type: "string", required: true, description: "Chart title" },
      {
        name: "data",
        type: "object[]",
        required: true,
        description: "Slices: each item is { name: string, value: number }",
        attributes: [
          { name: "name", type: "string", required: true },
          { name: "value", type: "number", required: true },
        ],
      },
    ],
    handler: async ({ title, data }) => {
      console.log("[showPieChart] title", title, "data", data);
      const clean: PieDatum[] = (data as any[])
        .map((d) => ({ name: String(d.name), value: Number(d.value) }))
        .filter((d) => Number.isFinite(d.value));
      console.log("[showPieChart] parsed", clean);
      setCharts((c) => [{ title: String(title), data: clean }, ...c].slice(0, 6));
      return `Rendered pie chart "${title}" with ${clean.length} slices.`;
    },
  });

  // Reset rendered charts.
  useCopilotAction({
    name: "clearCharts",
    description: "Remove all pie charts currently shown on the dashboard.",
    parameters: [],
    handler: async () => {
      setCharts([]);
      setGenCharts([]);
      return "Cleared all charts.";
    },
  });

  // Generic chart: agent picks the chart KIND (bar / line / area / pie /
  // donut / hbar / scatter) and supplies data. This is the L4-style
  // declarative GenUI action on the dashboard.
  useCopilotAction({
    name: "showChart",
    description:
      "Render ANY chart on the dashboard. Use this for bar, line, area, donut, horizontal bar, or scatter charts (use showPieChart only for a simple pie). Set kind to one of: 'pie'|'donut'|'bar'|'hbar'|'line'|'area'|'scatter'. Data is an array of objects each with a 'name' (category/x label) and one or more numeric fields. For single-series charts use 'value'. For multi-series (grouped bar / multi-line) include extra numeric keys per datum (e.g. {name:'Jan', revenue:120, cost:80}) and pass series:['revenue','cost'].",
    parameters: [
      {
        name: "kind",
        type: "string",
        required: true,
        description: "pie | donut | bar | hbar | line | area | scatter",
      },
      { name: "title", type: "string", required: true },
      {
        name: "data",
        type: "object[]",
        required: true,
        description:
          "Array of data points. Each has { name: string, value?: number, ...otherNumericSeries }",
      },
      {
        name: "series",
        type: "string[]",
        required: false,
        description:
          "Optional list of numeric keys to plot as separate series. Defaults to ['value'] or auto-detected numeric keys.",
      },
      { name: "xLabel", type: "string", required: false },
      { name: "yLabel", type: "string", required: false },
    ],
    handler: async ({ kind, title, data, series, xLabel, yLabel }) => {
      console.log("[showChart] kind", kind, "title", title, "data", data, "series", series, "xLabel", xLabel, "yLabel", yLabel);
      const spec: GenChartSpec = {
        kind: String(kind).toLowerCase() as ChartKind,
        title: String(title),
        xLabel: xLabel as string | undefined,
        yLabel: yLabel as string | undefined,
        series: series as string[] | undefined,
        data: (data as any[]).map((d) => {
          const out: any = { name: String(d.name) };
          for (const k of Object.keys(d)) {
            if (k === "name") continue;
            const v = (d as any)[k];
            const n = typeof v === "string" ? Number(v.replace(/[$,%\s]/g, "")) : Number(v);
            out[k] = Number.isFinite(n) ? n : v;
          }
          return out;
        }),
      };
      console.log("[showChart] parsed spec", spec);
      setGenCharts((c) => [spec, ...c].slice(0, 6));
      return `Rendered ${spec.kind} chart "${spec.title}" with ${spec.data.length} points.`;
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          Multi-Domain Copilot Dashboard
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Ask the assistant about Finance, HR, Healthcare or Wireless data
          stored in SQLite. Try: <em>“Show me the finance summary”</em> or{" "}
          <em>“Switch to healthcare and summarize the patients table”</em>.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDomain(d.key)}
            className={`text-left rounded-xl p-5 shadow-sm border transition bg-gradient-to-br ${d.color} text-white ${
              activeDomain === d.key
                ? "ring-4 ring-offset-2 ring-brand-500"
                : "opacity-90 hover:opacity-100"
            }`}
          >
            <div className="text-3xl">{d.emoji}</div>
            <div className="mt-2 font-semibold">{d.label}</div>
            <div className="text-xs opacity-90">Click to focus this domain</div>
          </button>
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {DOMAINS.map((d) => {
          const s = summaries[d.key];
          return (
            <div
              key={d.key}
              className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  {d.emoji} {d.label} summary
                </h3>
                {activeDomain === d.key && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    active
                  </span>
                )}
              </div>
              {s ? (
                <ul className="mt-3 text-sm divide-y divide-slate-100">
                  {Object.entries(s).map(([k, v]) => (
                    <li key={k} className="flex justify-between py-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-medium text-slate-900">
                        {String(v)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Ask the copilot for a summary to populate this card.
                </p>
              )}
            </div>
          );
        })}
      </section>

      {charts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              📊 Generated charts
            </h2>
            <button
              onClick={() => {
                setCharts([]);
                setGenCharts([]);
              }}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {charts.map((c, i) => (
              <GenPieChart key={`pie-${i}`} title={c.title} data={c.data} />
            ))}
          </div>
        </section>
      )}

      {genCharts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            📈 Agent-generated visualizations
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {genCharts.map((s, i) => (
              <GenChart key={`gc-${i}`} spec={s} />
            ))}
          </div>
        </section>
      )}

      <CopilotSidebar
        defaultOpen
        instructions="You are a multi-domain (Finance, HR, Healthcare, Wireless) data assistant backed by SQLite. You ALWAYS have UI rendering tools available — never tell the user you can't render charts or visualizations and never suggest Excel/Google Sheets. Workflow: (1) call the appropriate backend tool (finance_summary, hr_summary, healthcare_summary, wireless_summary, list_tables, table_schema, select_all_rows, summarize_table) to fetch real numbers, (2) call renderDomainSummary so the dashboard card updates, (3) for a chart, pick the right CHART KIND for the question and call showChart — use 'bar' for comparisons across categories, 'hbar' for many long labels, 'line' or 'area' for trends over time, 'pie' or 'donut' for share-of-total with 2–6 slices, 'scatter' for correlations. Only fall back to showPieChart for a quick simple pie. Multi-series example: showChart({kind:'bar', title:'Revenue vs Cost', data:[{name:'Jan',revenue:120,cost:80},{name:'Feb',revenue:140,cost:90}], series:['revenue','cost']}). Always use plain numbers in data — no '$', no commas. Confirm briefly in chat and cite the source table."
        labels={{
          title: "Domain Copilot",
          initial:
            "Hi! Ask me for a summary or any chart — e.g. 'Bar chart of finance summary', 'Line chart of monthly transactions', 'Donut of wireless usage'.",
        }}
      />
    </div>
  );
}
