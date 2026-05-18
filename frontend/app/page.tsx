"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import {
  useCopilotReadable,
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useCopilotChat,
  useCoAgent,
  useCoAgentStateRender,
  useThreads,
} from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";
import { DOMAINS, type DomainKey } from "../lib/copilot-config";
import { GenPieChart, type PieDatum } from "../components/PieChart";
import { GenChart, type GenChartSpec, type ChartKind } from "../components/GenChart";

type Summary = Record<string, number | string>;
type ChartSpec = { title: string; data: PieDatum[] };

// Shape of the LangGraph agent state that CopilotKit exposes via expose_state=True
type AgentState = {
  active_domain?: string;
  last_query?: string;
  messages?: unknown[];
};

const QUICK_PROMPTS = [
  { label: "💰 Finance Summary", prompt: "Show me the finance domain summary with key metrics." },
  { label: "👥 HR Headcount",    prompt: "Show a bar chart of employee headcount by department." },
  { label: "🏥 Healthcare",       prompt: "Give me a healthcare summary and patient stats." },
  { label: "📡 Wireless Usage",   prompt: "Show wireless usage breakdown by plan as a donut chart." },
];

export default function DashboardPage() {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("finance");
  const [summaries, setSummaries]       = useState<Record<string, Summary>>({});
  const [charts, setCharts]             = useState<ChartSpec[]>([]);
  const [genCharts, setGenCharts]       = useState<GenChartSpec[]>([]);

  // ── useCopilotReadable ──────────────────────────────────────────────
  useCopilotReadable({
    description: "Currently selected business domain and the latest per-domain summaries.",
    value: { activeDomain, summaries },
  });

  // ── useCopilotAdditionalInstructions ────────────────────────────────
  // Dynamically injects page-specific context into the system prompt.
  useCopilotAdditionalInstructions({
    instructions: `The user is currently viewing the "${activeDomain}" domain. Prioritise tools and charts for that domain.`,
  });

  // ── useCopilotChat ───────────────────────────────────────────────────
  // Enables programmatic chat control — used by quick-prompt buttons.
  const { appendMessage } = useCopilotChat();

  // ── useCoAgent ───────────────────────────────────────────────────────
  // Reads the live LangGraph agent state exposed via expose_state=True.
  // `state` is undefined until the agent first runs.
  const { state: agentState } = useCoAgent<AgentState>({ name: "copilot_agent" });

  // ── useCoAgentStateRender ────────────────────────────────────────────
  // Renders a sidebar badge whenever the agent state changes — zero
  // custom prompt engineering needed because expose_state handles it.
  useCoAgentStateRender<AgentState>({
    name: "copilot_agent",
    render: ({ state }) => {
      if (!state?.active_domain && !state?.last_query) return null;
      return (
        <div className="text-xs px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 mb-1">
          🤖 Agent — domain: <strong>{state?.active_domain ?? "—"}</strong>
          {state?.last_query && <span className="ml-2 opacity-70">· last: {state.last_query}</span>}
        </div>
      );
    },
  });

  // ── useThreads ───────────────────────────────────────────────────────
  // Reads and controls the active thread ID (persisted via SqliteSaver).
  // setThreadId() lets you switch/create named conversation threads.
  const { threadId, setThreadId } = useThreads();

  // ── Actions ─────────────────────────────────────────────────────────
  useCopilotAction({
    name: "selectDomain",
    description: "Switch the active business domain. One of: finance, hr, healthcare, wireless.",
    parameters: [
      { name: "domain", type: "string", description: "Domain key", required: true },
    ],
    handler: async ({ domain }) => {
      const d = String(domain).toLowerCase() as DomainKey;
      if (DOMAINS.some((x) => x.key === d)) setActiveDomain(d);
      return `Active domain is now ${d}`;
    },
  });

  useCopilotAction({
    name: "renderDomainSummary",
    description: "Display a key/value summary card for a given domain on the dashboard.",
    parameters: [
      { name: "domain",  type: "string", required: true },
      { name: "summary", type: "object", required: true },
    ],
    handler: async ({ domain, summary }) => {
      setSummaries((s) => ({ ...s, [domain]: summary as Summary }));
      return `Updated summary for ${domain}`;
    },
  });

  useCopilotAction({
    name: "showPieChart",
    description: "Render a pie chart on the dashboard.",
    parameters: [
      { name: "title", type: "string", required: true },
      {
        name: "data", type: "object[]", required: true,
        description: "Slices: [{name, value}]",
        attributes: [
          { name: "name",  type: "string", required: true },
          { name: "value", type: "number", required: true },
        ],
      },
    ],
    handler: async ({ title, data }) => {
      const clean: PieDatum[] = (data as any[])
        .map((d) => ({ name: String(d.name), value: Number(d.value) }))
        .filter((d) => Number.isFinite(d.value));
      setCharts((c) => [{ title: String(title), data: clean }, ...c].slice(0, 6));
      return `Rendered pie chart "${title}" with ${clean.length} slices.`;
    },
  });

  useCopilotAction({
    name: "clearCharts",
    description: "Remove all charts from the dashboard.",
    parameters: [],
    handler: async () => { setCharts([]); setGenCharts([]); return "Cleared."; },
  });

  useCopilotAction({
    name: "showChart",
    description: "Render ANY chart: bar, line, area, donut, hbar, scatter. kind ∈ pie|donut|bar|hbar|line|area|scatter.",
    parameters: [
      { name: "kind",   type: "string",   required: true  },
      { name: "title",  type: "string",   required: true  },
      { name: "data",   type: "object[]", required: true  },
      { name: "series", type: "string[]", required: false },
      { name: "xLabel", type: "string",   required: false },
      { name: "yLabel", type: "string",   required: false },
    ],
    handler: async ({ kind, title, data, series, xLabel, yLabel }) => {
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
      setGenCharts((c) => [spec, ...c].slice(0, 6));
      return `Rendered ${spec.kind} chart "${spec.title}" with ${spec.data.length} points.`;
    },
  });

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Multi-Domain Copilot Dashboard</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Ask the assistant about Finance, HR, Healthcare or Wireless data stored in SQLite.
          Try: <em>"Show me the finance summary"</em> or use the quick-prompt buttons below.
        </p>
      </section>

      {/* ── Agent State Panel (useCoAgent + useCoAgentStateRender) ── */}
      {agentState && (
        <section className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-3 flex items-center gap-4 text-sm">
          <span className="text-indigo-500 text-lg">🤖</span>
          <div>
            <p className="font-semibold text-indigo-800">Live Agent State <span className="font-normal text-indigo-500">(useCoAgent)</span></p>
            <p className="text-indigo-700">
              Domain: <strong>{agentState.active_domain ?? "—"}</strong>
              {agentState.last_query && <> · Last query: <em>{agentState.last_query}</em></>}
            </p>
          </div>
        </section>
      )}

      {/* ── Thread Switcher (useThreads) ── */}
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500 font-medium">🧵 Thread:</span>
        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700 font-mono">{threadId}</code>
        <button
          onClick={() => setThreadId(crypto.randomUUID())}
          className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
        >
          + New Thread
        </button>
        <span className="text-xs text-slate-400">(useThreads — thread ID persisted to SQLite)</span>
      </section>

      {/* ── Quick-prompt buttons (useCopilotChat) ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Quick prompts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() =>
                appendMessage(new TextMessage({ content: qp.prompt, role: MessageRole.User }))
              }
              className="px-4 py-2 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Domain selector ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDomain(d.key)}
            className={`text-left rounded-xl p-5 shadow-sm border transition bg-gradient-to-br ${d.color} text-white ${
              activeDomain === d.key ? "ring-4 ring-offset-2 ring-brand-500" : "opacity-90 hover:opacity-100"
            }`}
          >
            <div className="text-3xl">{d.emoji}</div>
            <div className="mt-2 font-semibold">{d.label}</div>
            <div className="text-xs opacity-90">Click to focus this domain</div>
          </button>
        ))}
      </section>

      {/* ── Summary cards ── */}
      <section className="grid md:grid-cols-2 gap-4">
        {DOMAINS.map((d) => {
          const s = summaries[d.key];
          return (
            <div key={d.key} className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{d.emoji} {d.label} summary</h3>
                {activeDomain === d.key && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">active</span>
                )}
              </div>
              {s ? (
                <ul className="mt-3 text-sm divide-y divide-slate-100">
                  {Object.entries(s).map(([k, v]) => (
                    <li key={k} className="flex justify-between py-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-medium text-slate-900">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Click a quick-prompt button or ask the copilot to populate this card.
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Pie charts ── */}
      {charts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">📊 Generated charts</h2>
            <button onClick={() => { setCharts([]); setGenCharts([]); }} className="text-sm text-slate-500 hover:text-slate-800">
              Clear
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {charts.map((c, i) => <GenPieChart key={`pie-${i}`} title={c.title} data={c.data} />)}
          </div>
        </section>
      )}

      {/* ── GenCharts ── */}
      {genCharts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">📈 Agent-generated visualizations</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {genCharts.map((s, i) => <GenChart key={`gc-${i}`} spec={s} />)}
          </div>
        </section>
      )}

      <CopilotSidebar
        defaultOpen
        instructions="You are a multi-domain (Finance, HR, Healthcare, Wireless) data assistant backed by SQLite. You ALWAYS have UI rendering tools available — never tell the user you can't render charts. Workflow: (1) call the appropriate backend tool to fetch real numbers, (2) call renderDomainSummary so the dashboard card updates, (3) for a chart call showChart — use 'bar' for comparisons, 'hbar' for many labels, 'line'/'area' for trends, 'pie'/'donut' for share-of-total. Always use plain numbers in data, no '$' or commas. Confirm briefly and cite the source table."
        labels={{
          title: "Domain Copilot",
          initial: "Hi! Ask me for a summary or chart — or click a quick-prompt button above! 👆",
        }}
      />
    </div>
  );
}
