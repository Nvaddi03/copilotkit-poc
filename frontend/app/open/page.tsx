"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotTextarea } from "@copilotkit/react-textarea";
import { useCopilotAction, useMakeCopilotDocumentReadable } from "@copilotkit/react-core";
import { useState } from "react";
import { GenChart } from "../../components/GenChart";
import { GenPieChart } from "../../components/PieChart";

/**
 * L5 · Open Generative UI + CopilotTextarea.
 *
 * 1. renderMarkdown action — lets the agent stream rich markdown inline
 *    in the chat (open / free-form GenUI).
 * 2. CopilotTextarea — AI-enhanced textarea with autocomplete suggestions
 *    powered by the same CopilotKit context.
 */
export default function OpenGenUIPage() {
  const [textareaValue, setTextareaValue] = useState("");

  // ── L5: Open GenUI — JSON-driven runtime registry ───────────────────────
  // Agent calls renderComponent({ component, props }) from a known registry.
  // This is the schema-based open GenUI pattern — one action, unlimited layouts.
  type RenderedComponent = { id: number; component: string; props: Record<string, unknown> };
  const [renderedComponents, setRenderedComponents] = useState<RenderedComponent[]>([]);

  // ── L2: In-chat Streaming Render — status-aware skeleton ────────────────
  // The render: prop receives { args, status } LIVE while the LLM streams args.
  // We show a pulsing skeleton when status === "inProgress", the chart when done.
  useCopilotAction({
    name: "renderStreamingChart",
    description:
      "Render a bar or pie chart directly inside the chat. Stream the data progressively.",
    parameters: [
      { name: "title",  type: "string",   required: true },
      { name: "kind",   type: "string",   required: true, description: "bar | pie | line | area" },
      { name: "labels", type: "string[]", required: true },
      { name: "values", type: "number[]", required: true },
    ],
    render: ({ args, status }) => (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[160px]">
        {status === "inProgress" ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="h-32 rounded bg-slate-100" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-3 flex-1 rounded bg-slate-200" />)}
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold text-slate-700 mb-2">{args.title}</div>
            {(args.kind === "pie" || args.kind === "donut") ? (
              <GenPieChart
                data={(args.labels ?? []).map((l: string, i: number) => ({ name: l, value: (args.values ?? [])[i] ?? 0 }))}
              />
            ) : (
              <GenChart
                spec={{
                  kind: (args.kind as "bar" | "line" | "area") ?? "bar",
                  title: args.title ?? "",
                  data: (args.labels ?? []).map((l: string, i: number) => ({ name: l, value: (args.values ?? [])[i] ?? 0 })),
                  series: ["value"],
                }}
              />
            )}
          </div>
        )}
      </div>
    ),
    handler: async () => "streaming chart rendered",
  });

  // ── L5: renderComponent — true open schema-driven GenUI ─────────────────
  useCopilotAction({
    name: "renderComponent",
    description:
      "Render any supported UI component by name + props. " +
      "Supported: Stat (label, value, delta), Alert (type: info|warning|error|success, title, body), " +
      "Badge (text, color), Timeline (items: [{date,title,description}]), " +
      "Progress (label, value 0-100).",
    parameters: [
      { name: "component", type: "string", required: true },
      { name: "props",     type: "object", required: true },
    ],
    render: ({ args, status }) => {
      if (status === "inProgress") {
        return <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />;
      }
      const p = (args.props ?? {}) as Record<string, unknown>;
      switch (args.component) {
        case "Stat":
          return (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{String(p.label ?? "")}</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">{String(p.value ?? "")}</div>
              {p.delta && <div className={`text-xs mt-1 ${String(p.delta).startsWith("+") ? "text-green-600" : "text-red-500"}`}>{String(p.delta)}</div>}
            </div>
          );
        case "Alert": {
          const colors: Record<string, string> = { info: "blue", warning: "amber", error: "red", success: "green" };
          const c = colors[String(p.type ?? "info")] ?? "blue";
          return (
            <div className={`rounded-xl border border-${c}-200 bg-${c}-50 p-4`}>
              <div className={`font-semibold text-${c}-800`}>{String(p.title ?? "")}</div>
              <div className={`text-sm text-${c}-700 mt-1`}>{String(p.body ?? "")}</div>
            </div>
          );
        }
        case "Badge":
          return (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {String(p.text ?? "")}
            </span>
          );
        case "Progress":
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between text-sm text-slate-700 mb-2">
                <span>{String(p.label ?? "")}</span><span>{String(p.value ?? 0)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, Number(p.value ?? 0))}%` }} />
              </div>
            </div>
          );
        case "Timeline":
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              {((p.items as { date: string; title: string; description?: string }[]) ?? []).map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1" />
                    {i < ((p.items as unknown[]) ?? []).length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-slate-400">{item.date}</div>
                    <div className="font-medium text-slate-800">{item.title}</div>
                    {item.description && <div className="text-sm text-slate-500 mt-0.5">{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          );
        default:
          return <div className="text-sm text-slate-500 italic">Unknown component: {String(args.component)}</div>;
      }
    },
    handler: async ({ component, props }) => {
      setRenderedComponents(prev => [...prev, { id: Date.now(), component, props: props as Record<string, unknown> }]);
      return `rendered ${component}`;
    },
  });

  // ── useMakeCopilotDocumentReadable ─────────────────────────────────────────
  // Injects a structured "document" (any object) into CopilotKit's context so
  // the LLM can reference it. Perfect for user-generated content like the
  // textarea value — the agent can summarize or analyse what the user typed.
  useMakeCopilotDocumentReadable(
    {
      id: "textarea-draft",
      name: "User's current draft text",
      sourceApplication: "open-genui-page",
      iconImageUri: "",
      getContents: () => textareaValue || "(empty — user hasn't typed yet)",
    },
    undefined,
    [textareaValue],
  );

  useCopilotAction({
    name: "renderMarkdown",
    description:
      "Render an arbitrary markdown block to the user. Use for free-form, open generative UI.",
    parameters: [
      { name: "markdown", type: "string", required: true },
    ],
    render: ({ args }) => (
      <div className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <pre className="whitespace-pre-wrap text-sm text-slate-800">
          {args.markdown}
        </pre>
      </div>
    ),
    handler: async () => "rendered",
  });

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <header>
        <h1 className="text-2xl font-bold">L2 + L5 · Streaming Render &amp; Open Generative UI</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          <strong>L2 — Streaming Render:</strong> <code>renderStreamingChart</code> shows a pulsing skeleton while the LLM streams args, then the final chart — all inside the chat thread.
          <br />
          <strong>L5 — Open GenUI:</strong> <code>renderComponent</code> is a JSON schema-driven action; the agent picks any component (Stat, Alert, Badge, Progress, Timeline) and passes <code>props</code> — one action, unlimited layouts.
          <br />
          <strong>CopilotTextarea + useMakeCopilotDocumentReadable:</strong> AI-enhanced textarea with autocomplete.
        </p>
      </header>

      {/* ── Rendered Components Panel ── */}
      {renderedComponents.length > 0 && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-indigo-800 text-lg">🧩 Rendered Components (L5 Open GenUI)</h2>
            <button onClick={() => setRenderedComponents([])} className="text-xs text-indigo-500 hover:text-indigo-700 underline">Clear all</button>
          </div>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {renderedComponents.map(rc => (
              <div key={rc.id} className="flex flex-col gap-1">
                <span className="text-xs font-mono text-indigo-400">{rc.component}</span>
                {/* Re-use the same switch renderer inline */}
                {(() => {
                  const p = rc.props;
                  switch (rc.component) {
                    case "Stat":
                      return (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
                          <div className="text-xs text-slate-500 uppercase tracking-wide">{String(p.label ?? "")}</div>
                          <div className="text-2xl font-bold text-indigo-700 mt-1">{String(p.value ?? "")}</div>
                          {p.delta && <div className={`text-xs mt-1 ${String(p.delta).startsWith("+") ? "text-green-600" : "text-red-500"}`}>{String(p.delta)}</div>}
                        </div>
                      );
                    case "Badge":
                      return <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">{String(p.text ?? "")}</span>;
                    case "Progress":
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex justify-between text-sm text-slate-700 mb-2"><span>{String(p.label ?? "")}</span><span>{String(p.value ?? 0)}%</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${Math.min(100, Number(p.value ?? 0))}%` }} /></div>
                        </div>
                      );
                    default:
                      return <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs font-mono">{JSON.stringify(rc.props, null, 2)}</div>;
                  }
                })()}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CopilotTextarea demo ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="font-semibold text-slate-800 text-lg">
          ✏️ CopilotTextarea — AI-Enhanced Text Input
        </h2>
        <p className="text-sm text-slate-500">
          Start typing a business report or email. CopilotKit will suggest completions.
          Press <kbd className="px-1 py-0.5 text-xs bg-slate-100 border rounded">Tab</kbd> to accept.
        </p>
        <CopilotTextarea
          value={textareaValue}
          onValueChange={setTextareaValue}
          placeholder="Start typing a business summary, email draft, or analysis…"
          className="w-full min-h-[140px] rounded-lg border border-slate-300 p-3 text-sm text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autosuggestionsConfig={{
            textareaPurpose: "Business report or summary for Finance, HR, Healthcare, or Wireless domain analysis.",
            chatApiConfigs: {},
          }}
        />
        {textareaValue && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 font-mono whitespace-pre-wrap">
            <span className="font-semibold text-slate-400 block mb-1">Current value:</span>
            {textareaValue}
          </div>
        )}
      </section>

      {/* ── Open GenUI Chat ── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800 text-lg">💬 L2 + L5 Chat — Streaming &amp; Open GenUI</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: "📊 Streaming chart", prompt: "Show me a bar chart of Q1 revenue by region using renderStreamingChart" },
            { label: "📈 Stat cards", prompt: "Show 3 KPI stat components for our Finance domain" },
            { label: "⏱️ Timeline", prompt: "Create a project timeline for a 6-week ML deployment" },
            { label: "🚦 Progress bars", prompt: "Show quarterly goal progress as 4 progress components" },
          ].map(s => (
            <button key={s.label} className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-100 transition-colors"
              onClick={() => navigator.clipboard?.writeText(s.prompt).catch(() => null)}>
              {s.label} <span className="opacity-50">(copy)</span>
            </button>
          ))}
        </div>
        <div className="h-[65vh] rounded-xl border border-slate-200 bg-white overflow-hidden">
          <CopilotChat
            instructions={`You have two powerful rendering tools:

1. renderStreamingChart(title, kind, labels[], values[]) — renders a chart inside the chat. kind can be: bar, line, area, pie. Use this for any data visualization request.

2. renderComponent(component, props) — renders a UI component. Available components:
   - Stat: { label, value, delta? }  e.g. { label: "Revenue", value: "$1.2M", delta: "+12%" }
   - Alert: { type: "info|warning|error|success", title, body }
   - Badge: { text }
   - Progress: { label, value: 0-100 }
   - Timeline: { items: [{date, title, description?}] }

3. renderMarkdown(markdown) — for formatted text, tables, code blocks.

Always prefer renderStreamingChart for data, renderComponent for structured UI, renderMarkdown for prose.`}
            labels={{ title: "Open GenUI", initial: "Try: 'Show me a bar chart of Q1 revenue' or 'Show 3 KPI stats for Finance'" }}
          />
        </div>
      </section>
    </div>
  );
}
