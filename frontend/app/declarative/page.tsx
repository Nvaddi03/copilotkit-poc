"use client";

import { useState } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { GenChart } from "../../components/GenChart";
import { GenPieChart } from "../../components/PieChart";

// ── Types ──────────────────────────────────────────────────────────────────

type StatSpec = { label: string; value: string | number; delta?: string; trend?: "up" | "down" | "flat" };
type ChartSpec = { kind: "pie" | "donut" | "bar" | "hbar" | "line" | "area" | "scatter"; title: string; data: { name: string; value: number }[]; series?: string[] };
type TableSpec = { title?: string; columns: string[]; rows: (string | number)[][] };
type CalloutSpec = { tone?: "info" | "success" | "warn" | "danger"; title?: string; text: string };

interface DashboardState {
  title: string;
  subtitle?: string;
  stats: StatSpec[];
  charts: ChartSpec[];
  tables?: TableSpec[];
  callouts?: CalloutSpec[];
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ stat, index }: { stat: StatSpec; index: number }) {
  const gradients = [
    "from-indigo-500 to-indigo-700",
    "from-emerald-500 to-emerald-700",
    "from-violet-500 to-violet-700",
    "from-amber-500 to-amber-600",
    "from-cyan-500 to-cyan-700",
    "from-rose-500 to-rose-700",
  ];
  const icons = ["📊", "📈", "💡", "⚡", "🎯", "🔥"];
  const g = gradients[index % gradients.length];
  const icon = icons[index % icons.length];
  const trendIcon = stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "";
  const trendColor = stat.trend === "up" ? "text-emerald-300" : stat.trend === "down" ? "text-rose-300" : "text-slate-300";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${g} p-5 text-white shadow-lg`}>
      <div className="absolute right-4 top-4 text-3xl opacity-20">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{stat.label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{stat.value}</p>
      {stat.delta && (
        <p className={`mt-1 text-sm font-medium ${trendColor}`}>
          {trendIcon} {stat.delta}
        </p>
      )}
    </div>
  );
}

function ChartCard({ chart }: { chart: ChartSpec }) {
  if (chart.kind === "pie" || chart.kind === "donut") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h4 className="font-semibold text-slate-800 mb-3 text-sm">{chart.title}</h4>
        <div className="h-64">
          <GenPieChart data={chart.data} title="" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <GenChart spec={{ kind: chart.kind, title: chart.title, data: chart.data, series: chart.series }} />
    </div>
  );
}

function DataTable({ table }: { table: TableSpec }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {table.title && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h4 className="font-semibold text-slate-800 text-sm">{table.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              {table.columns.map((c) => (
                <th key={c} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-700">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalloutBanner({ callout }: { callout: CalloutSpec }) {
  const styles: Record<string, string> = {
    info: "bg-sky-50 border-sky-200 text-sky-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-rose-50 border-rose-200 text-rose-800",
  };
  const icons: Record<string, string> = { info: "ℹ️", success: "✅", warn: "⚠️", danger: "🚨" };
  const tone = callout.tone || "info";
  return (
    <div className={`rounded-2xl border p-4 flex gap-3 items-start ${styles[tone]}`}>
      <span className="text-lg mt-0.5">{icons[tone]}</span>
      <div>
        {callout.title && <p className="font-semibold text-sm mb-0.5">{callout.title}</p>}
        <p className="text-sm">{callout.text}</p>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DeclarativePage() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useCopilotAction({
    name: "clearDashboard",
    description: "Clear the current dashboard. Call this FIRST before building any new dashboard.",
    parameters: [],
    handler: async () => {
      setDashboard(null);
      return "Dashboard cleared.";
    },
  });

  useCopilotAction({
    name: "buildDashboard",
    description:
      "Build a complete enterprise dashboard. " +
      "REQUIRED: you MUST provide BOTH 'stats' AND 'charts'. A dashboard with no charts is INVALID. " +
      "Call clearDashboard first, fetch all data, then call buildDashboard ONCE with everything. " +
      "MINIMUM: 2 stats + 2 charts.",
    parameters: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Dashboard title, e.g. 'Wireless Analytics Dashboard'",
      },
      {
        name: "subtitle",
        type: "string",
        required: false,
        description: "Optional subtitle or time range",
      },
      {
        name: "stats",
        type: "object[]",
        required: true,
        description:
          "KPI cards array. Each item: {label:string, value:number|string, delta?:string, trend?:'up'|'down'|'flat'}. " +
          "Minimum 2, recommended 4. Use real numbers from summary tools.",
      },
      {
        name: "charts",
        type: "object[]",
        required: true,
        description:
          "REQUIRED CHARTS array — MINIMUM 2 charts, NEVER empty. Each: " +
          "{kind:'pie'|'donut'|'bar'|'hbar'|'line'|'area'|'scatter', title:string, data:[{name:string,value:number}]}. " +
          "Use group_by_count(table,col) for pie/bar distributions. Use group_by_sum(table,groupCol,valueCol) for bar/line totals. " +
          "NEVER submit charts=[] or omit this field.",
      },
      {
        name: "tables",
        type: "object[]",
        required: false,
        description: "Optional tables. Each: {title?:string, columns:string[], rows:(string|number)[][]}",
      },
      {
        name: "callouts",
        type: "object[]",
        required: false,
        description: "Optional insights. Each: {tone:'info'|'success'|'warn'|'danger', title?:string, text:string}",
      },
    ],
    handler: async ({ title, subtitle, stats, charts, tables, callouts }) => {
      const statsArr = (stats || []) as StatSpec[];
      const chartsArr = (charts || []) as ChartSpec[];

      if (chartsArr.length === 0) {
        return "ERROR: charts array is empty. You MUST provide at least 2 charts with real data. Retry using group_by_count and group_by_sum.";
      }

      setLoading(true);
      await new Promise((r) => setTimeout(r, 80));
      setDashboard({
        title: title as string,
        subtitle: subtitle as string | undefined,
        stats: statsArr,
        charts: chartsArr,
        tables: (tables || []) as TableSpec[],
        callouts: (callouts || []) as CalloutSpec[],
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      return `Dashboard built: ${statsArr.length} KPIs, ${chartsArr.length} charts.`;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">🏢 Enterprise Analytics Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              L4 · Declarative Generative UI — AI builds the entire dashboard from real data
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">Updated {lastUpdated}</span>
            )}
            {dashboard && (
              <button
                onClick={() => setDashboard(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition"
              >
                🗑 Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Building your enterprise dashboard…
          </div>
        )}

        {!dashboard && !loading && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Ready to visualize your data</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Ask the AI to build a dashboard. It will fetch real data and create KPI cards,
              charts, tables, and AI insights automatically.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Wireless dashboard", "Finance dashboard", "HR analytics", "Healthcare overview"].map((s) => (
                <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                  &quot;{s}&quot;
                </span>
              ))}
            </div>
          </div>
        )}

        {dashboard && !loading && (
          <>
            {/* Title */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{dashboard.title}</h2>
                {dashboard.subtitle && (
                  <p className="text-sm text-slate-500 mt-1">{dashboard.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-700 font-medium">Live Data</span>
              </div>
            </div>

            {/* KPI Cards */}
            {dashboard.stats.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dashboard.stats.map((s, i) => (
                    <KpiCard key={i} stat={s} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Charts */}
            {dashboard.charts.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Analytics &amp; Visualizations
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  {dashboard.charts.map((c, i) => (
                    <ChartCard key={i} chart={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Tables */}
            {dashboard.tables && dashboard.tables.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Detailed Data
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  {dashboard.tables.map((t, i) => (
                    <DataTable key={i} table={t} />
                  ))}
                </div>
              </section>
            )}

            {/* Callouts */}
            {dashboard.callouts && dashboard.callouts.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  AI Insights
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {dashboard.callouts.map((c, i) => (
                    <CalloutBanner key={i} callout={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
              <span>Generated by AI · CopilotKit Declarative GenUI (L4)</span>
              <span>{dashboard.stats.length} KPIs · {dashboard.charts.length} Charts · {lastUpdated}</span>
            </div>
          </>
        )}
      </div>

      <CopilotPopup
        defaultOpen
        instructions={`You are an enterprise data analyst AI. Your ONLY job is to call data tools then call buildDashboard.

AVAILABLE FRONTEND ACTIONS:
  clearDashboard()   — resets the canvas (call FIRST always)
  buildDashboard(title, subtitle?, stats, charts, tables?, callouts?)

MANDATORY WORKFLOW (follow exactly):
  1. clearDashboard()
  2. Call data tools to get REAL numbers:
       wireless_summary() or finance_summary() → KPI totals for stats array
       group_by_count(table, column) → pie/bar chart distributions
       group_by_sum(table, groupCol, valueCol) → bar/line chart sums
  3. buildDashboard(...) — ONE call with EVERYTHING

HARD RULES — NEVER VIOLATE:
  ❶ charts MUST have ≥ 2 items — NEVER call buildDashboard with charts=[] or 1 chart
  ❷ Every chart data array MUST use real numbers from group_by_count or group_by_sum
  ❸ stats MUST have ≥ 2 items with real values from summary tools
  ❹ Call buildDashboard exactly ONCE per user request
  ❺ NEVER call showChart, renderUI, renderDomainSummary — they do not exist on this page

WIRELESS DASHBOARD EXAMPLE:
  clearDashboard()
  totals = wireless_summary()
  plan_dist = group_by_count("wireless_customers", "plan_type")
  monthly_gb = group_by_sum("wireless_usage", "signup_month", "data_used_gb")
  churn = group_by_count("wireless_customers", "churn_status")
  buildDashboard(
    title="Wireless Analytics Dashboard",
    subtitle="Subscriber & usage metrics",
    stats=[
      {label:"Total Subscribers", value:50, delta:"+5 MoM", trend:"up"},
      {label:"Total Data Used (GB)", value:1717, delta:"+12%", trend:"up"},
      {label:"Avg Data/Customer (GB)", value:34.3},
      {label:"Total Minutes Used", value:88328}
    ],
    charts=[
      {kind:"pie",  title:"Subscribers by Plan Type",  data:[{name:"Basic",value:32},{name:"Premium",value:18}]},
      {kind:"bar",  title:"Monthly Data Usage (GB)",   data:[{name:"Jan",value:120},{name:"Feb",value:145},...]}
      {kind:"donut",title:"Churn Status Distribution", data:[{name:"Active",value:42},{name:"Churned",value:8}]}
    ],
    callouts=[
      {tone:"info", title:"Key Insight", text:"Premium plan customers represent 36% of subscribers."}
    ]
  )

CHART kind OPTIONS:
  "pie"    → category distributions
  "donut"  → same as pie, modern style
  "bar"    → category comparisons
  "hbar"   → horizontal bar for long labels
  "line"   → trends over time
  "area"   → volume over time
  "scatter"→ correlations

Data format: [{name: string, value: number}] — plain numbers, NO "$" NO commas NO "%"`}
        labels={{
          title: "Dashboard Builder AI",
          initial: "👋 Tell me what dashboard to build!\n\nTry: **'Wireless dashboard'** or **'Finance dashboard'**\n\nI'll fetch real data and build a full enterprise layout with KPIs, charts, and insights.",
        }}
      />
    </div>
  );
}
