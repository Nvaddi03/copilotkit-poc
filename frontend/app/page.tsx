"use client";

import { useState, useEffect, useRef } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import {
  useCopilotReadable,
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useCopilotChat,
  useCoAgent,
  useCoAgentStateRender,
  useThreads,
  useCopilotChatSuggestions,
  useDefaultTool,
  useCopilotContext,
  CopilotTask,
} from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";import { DOMAINS, type DomainKey } from "../lib/copilot-config";
import { GenPieChart, type PieDatum } from "../components/PieChart";
import { GenChart, type GenChartSpec, type ChartKind } from "../components/GenChart";

type Summary = Record<string, unknown>;

/** Flatten a summary object into display rows — handles nested objects and arrays */
function flattenSummary(s: Summary): { label: string; value: string; isHeader?: boolean; isTable?: boolean; tableRows?: { name: string; value: string }[] }[] {
  const rows: { label: string; value: string; isHeader?: boolean; isTable?: boolean; tableRows?: { name: string; value: string }[] }[] = [];

  for (const [k, v] of Object.entries(s)) {
    const prettyKey = k.replace(/_/g, " ");

    if (Array.isArray(v)) {
      // Array of objects → render as a mini table block
      // Detect if items have name+count/value pattern
      const items = v as Record<string, unknown>[];
      const nameKey = items[0] && ("name" in items[0] ? "name" : "department" in items[0] ? "department" : null);
      const valKey  = items[0] && ("count" in items[0] ? "count" : "value" in items[0] ? "value" : "total" in items[0] ? "total" : null);

      if (nameKey && valKey) {
        rows.push({
          label: prettyKey,
          value: "",
          isTable: true,
          tableRows: items.map(item => ({
            name: String(item[nameKey] ?? ""),
            value: formatVal(item[valKey]),
          })),
        });
      } else {
        // fallback: just show count
        rows.push({ label: prettyKey, value: `${v.length} items` });
      }
    } else if (v !== null && typeof v === "object") {
      // Nested object → expand sub-keys
      for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
        rows.push({ label: `${prettyKey} › ${sk.replace(/_/g, " ")}`, value: formatVal(sv) });
      }
    } else {
      rows.push({ label: prettyKey, value: formatVal(v) });
    }
  }
  return rows;
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? v.toLocaleString()
      : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(v);
}
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
  const [taskRunning, setTaskRunning]   = useState(false);
  const [taskResult, setTaskResult]     = useState<string | null>(null);

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
  const { state: agentState } = useCoAgent<AgentState>({ name: "copilotkit-agent" });

  // ── useCoAgentStateRender ────────────────────────────────────────────
  // Renders a sidebar badge whenever the agent state changes — zero
  // custom prompt engineering needed because expose_state handles it.
  useCoAgentStateRender<AgentState>({
    name: "copilotkit-agent",
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

  // ── useCopilotChatSuggestions ────────────────────────────────────────
  // Configures AI-generated follow-up suggestions shown below the chat input.
  // `available: "always"` means suggestions appear throughout the conversation.
  useCopilotChatSuggestions({
    instructions: `Suggest 3 short follow-up questions the user might ask about the "${activeDomain}" domain. Make them specific, actionable and different from each other.`,
    available: "always",
    minSuggestions: 2,
    maxSuggestions: 4,
  }, [activeDomain]);

  // ── useDefaultTool ───────────────────────────────────────────────────
  // Registers a wildcard (*) catch-all that renders any unhandled tool call
  // inline in the chat — shows tool name + args as a compact badge.
  useDefaultTool({
    render: ({ name, args }: any) => (
      <div className="text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-500 mt-1">
        🔧 <strong>{name ?? "tool"}</strong>
        {args && Object.keys(args).length > 0 && (
          <span className="ml-2 font-mono">{JSON.stringify(args).slice(0, 80)}</span>
        )}
      </div>
    ),
  });

  // ── useCopilotContext + CopilotTask ──────────────────────────────────
  // CopilotTask lets you trigger a one-shot AI task programmatically from
  // a button click — without using the chat input at all.
  const copilotContext = useCopilotContext();

  const runDomainSnapshot = async () => {
    setTaskRunning(true);
    setTaskResult(null);
    try {
      const task = new CopilotTask({
        instructions: `Call renderDomainSummary for the "${activeDomain}" domain using the appropriate backend tool. Fetch the summary and populate the dashboard card.`,
        includeCopilotReadable: true,
        includeCopilotActions: true,
      });
      await task.run(copilotContext);
      setTaskResult(`✅ CopilotTask completed for "${activeDomain}" domain.`);
    } catch (e) {
      setTaskResult(`❌ Task error: ${String(e)}`);
    } finally {
      setTaskRunning(false);
    }
  };

  // ── Agentic Background Task — auto-run on domain switch ─────────────
  // Demonstrates CopilotTask triggered programmatically (not by user chat).
  // Fires once per domain change after the initial mount — simulates a
  // background/scheduled agent run without any user chat input.
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    // Background task: auto-fetch summary when domain changes
    const bgTask = new CopilotTask({
      instructions: `Auto-refresh: call renderDomainSummary for the "${activeDomain}" domain so the dashboard card stays current.`,
      includeCopilotReadable: true,
      includeCopilotActions: true,
    });
    bgTask.run(copilotContext).catch(() => {/* silently ignore bg errors */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDomain]);

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
      {agentState?.active_domain && (
        <section className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-3 flex items-center gap-4 text-sm">
          <span className="text-indigo-500 text-lg">🤖</span>
          <div>
            <p className="font-semibold text-indigo-800">Live Agent State <span className="font-normal text-indigo-500">(useCoAgent)</span></p>
            <p className="text-indigo-700">
              Domain: <strong>{agentState.active_domain}</strong>
              {agentState.last_query && <> · Last query: <em>{agentState.last_query}</em></>}
            </p>
          </div>
        </section>
      )}

      {/* ── Thread Switcher (useThreads) ── */}
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500 font-medium">🧵 Thread:</span>
        <code suppressHydrationWarning className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700 font-mono">{threadId}</code>
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

      {/* ── CopilotTask — programmatic one-shot task (no chat input needed) ── */}
      <section className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-violet-600 font-medium">⚡ CopilotTask</span>
        <span className="text-xs text-violet-500">Run a programmatic AI task without typing in chat:</span>
        <button
          onClick={runDomainSnapshot}
          disabled={taskRunning}
          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-50 transition"
        >
          {taskRunning ? "Running…" : `📸 Snapshot "${activeDomain}" domain`}
        </button>
        {taskResult && (
          <span className="text-xs text-violet-700 font-medium">{taskResult}</span>
        )}
      </section>

      {/* ── Domain selector ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDomain(d.key)}
            style={{ backgroundColor: d.bg, borderColor: d.border, color: d.text }}
            className={`text-left rounded-xl p-5 shadow-sm border-2 transition hover:opacity-90 ${
              activeDomain === d.key ? "ring-4 ring-offset-2 ring-slate-400 shadow-md" : ""
            }`}
          >
            <div className="text-3xl">{d.emoji}</div>
            <div className="mt-2 font-semibold">{d.label}</div>
            <div className="text-xs mt-0.5" style={{ opacity: 0.65 }}>Click to focus</div>
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
                  {flattenSummary(s).map((row, i) =>
                    row.isTable ? (
                      <li key={i} className="py-2">
                        <p className="text-slate-500 capitalize font-medium mb-1">{row.label}</p>
                        <div className="rounded-lg border border-slate-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <tbody>
                              {row.tableRows!.map((tr, j) => (
                                <tr key={j} className={j % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                                  <td className="px-3 py-1.5 text-slate-600 truncate max-w-[160px]">{tr.name}</td>
                                  <td className="px-3 py-1.5 text-slate-900 font-semibold tabular-nums text-right">{tr.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </li>
                    ) : (
                      <li key={i} className="flex justify-between py-1.5 gap-4">
                        <span className="text-slate-500 capitalize">{row.label}</span>
                        <span className="font-medium text-slate-900 text-right tabular-nums">{row.value}</span>
                      </li>
                    )
                  )}
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

      {/* ── Charts — unified section (pie + gen charts together) ── */}
      {(charts.length > 0 || genCharts.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">📊 Visualizations</h2>
            <button
              onClick={() => { setCharts([]); setGenCharts([]); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              🗑 Clear all charts
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {genCharts.map((s, i) => <GenChart key={`gc-${i}`} spec={s} />)}
            {charts.map((c, i) => <GenPieChart key={`pie-${i}`} title={c.title} data={c.data} />)}
          </div>
        </section>
      )}

      <CopilotSidebar
        defaultOpen
        instructions={`You are a multi-domain (Finance, HR, Healthcare, Wireless) data assistant backed by SQLite.

STRICT RULES — follow every time:
1. When the user asks for a CHART (bar, line, area, pie, donut, scatter), you MUST call showChart. No exceptions.
2. When the user asks for a SUMMARY or data, call renderDomainSummary to update the dashboard card.
3. When the user asks for BOTH (e.g. "show summary and a chart"), call BOTH renderDomainSummary AND showChart.
4. NEVER skip showChart if the user said "chart", "bar chart", "pie chart", "visualize", "plot", or "graph".

showChart rules:
- kind: 'bar' for category comparisons, 'hbar' for many labels (>6), 'line'/'area' for trends, 'pie'/'donut' for share-of-total.
- data: ALWAYS aggregate/group first. Each point must be { name: string, value: number } with plain numbers only (no $, %, commas).
- title: short descriptive string.

Example — "Show a bar chart of employee headcount by department":
→ Step 1: call hr_summary or group_by_count to get department counts
→ Step 2: call renderDomainSummary with the aggregated data
→ Step 3: call showChart with kind="bar", title="Headcount by Department", data=[{name:"Engineering",value:12}, ...]`}
        labels={{
          title: "Domain Copilot",
          initial: "Hi! Ask me for a summary or chart — or click a quick-prompt button above! 👆",
        }}
      />
    </div>
  );
}
