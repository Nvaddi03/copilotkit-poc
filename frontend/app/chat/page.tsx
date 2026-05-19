"use client";

import { CopilotChat, useChatContext } from "@copilotkit/react-ui";
import {
  useCopilotMessagesContext,
  useLazyToolRenderer,
  useRenderToolCall,
  useCopilotChatSuggestions,
} from "@copilotkit/react-core";
import { useState } from "react";

/**
 * /chat — Full-screen CopilotChat page.
 *
 * Demonstrates:
 * • CopilotChat                 — embedded full-screen chat widget
 * • Custom AssistantMessage     — custom render prop for assistant bubbles
 * • Custom UserMessage          — custom render prop for user bubbles
 * • useChatContext               — access chat open/close state & labels
 * • useCopilotChatSuggestions   — domain-aware follow-up suggestions
 * • useRenderToolCall            — inline tool call renderer inside chat
 * • useLazyToolRenderer          — lazy/deferred tool rendering util
 * • useCopilotMessagesContext    — read-only access to live message list
 */

// ── Chat context panel using useChatContext ───────────────────────────────────
// useChatContext exposes: { labels, icons, open, setOpen }
// Must be a child of CopilotChat to access the context.
function ChatContextPanel() {
  const ctx = useChatContext();
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="text-slate-500">
        Chat <strong>{ctx.open ? "open ✓" : "closed"}</strong>
      </span>
      <span className="text-slate-400">
        Title: <code className="text-slate-600">{ctx.labels?.title ?? "—"}</code>
      </span>
      <button
        onClick={() => ctx.setOpen(!ctx.open)}
        className="px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs"
      >
        Toggle
      </button>
      <span className="text-slate-300 text-xs italic">useChatContext</span>
    </div>
  );
}

// ── Message counter panel using useCopilotMessagesContext ─────────────────────
function MessageStats() {
  const { messages } = useCopilotMessagesContext();
  const textCount   = messages.filter((m: any) => typeof m.isTextMessage === "function" && m.isTextMessage()).length;
  const actionCount = messages.filter((m: any) => typeof m.isActionExecutionMessage === "function" && m.isActionExecutionMessage()).length;
  const resultCount = messages.filter((m: any) => typeof m.isResultMessage === "function" && m.isResultMessage()).length;
  return (
    <div className="flex gap-3 flex-wrap text-xs">
      <span className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
        �� Text: <strong>{textCount}</strong>
      </span>
      <span className="px-2 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
        🔧 Tool calls: <strong>{actionCount}</strong>
      </span>
      <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
        📦 Results: <strong>{resultCount}</strong>
      </span>
      <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
        Total: <strong>{messages.length}</strong>
      </span>
    </div>
  );
}

export default function ChatPage() {
  const [activeDomain, setActiveDomain] = useState("finance");

  // ── useCopilotChatSuggestions ─────────────────────────────────────────────────
  useCopilotChatSuggestions({
    instructions: `Suggest 3 short follow-up data questions for the "${activeDomain}" domain.`,
    available: "always",
    minSuggestions: 2,
    maxSuggestions: 4,
  }, [activeDomain]);

  // ── useRenderToolCall — inline renderer for "showChart" tool ─────────────────
  useRenderToolCall({
    name: "showChart",
    parameters: [],
    render: ({ status, args }) => {
      const a = args as any;
      return (
        <div className="mt-1 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-800">
          {status === "executing" ? (
            <span>⏳ Generating chart…</span>
          ) : (
            <span>
              📊 <strong>{a?.title ?? "Chart"}</strong> — {a?.kind ?? "chart"} with{" "}
              {Array.isArray(a?.data) ? a.data.length : "?"} data points
            </span>
          )}
        </div>
      );
    },
  });

  // ── useRenderToolCall — inline renderer for "renderDomainSummary" ────────────
  useRenderToolCall({
    name: "renderDomainSummary",
    parameters: [],
    render: ({ status, args }) => {
      const a = args as any;
      if (status === "executing") {
        return <div className="text-xs text-slate-400 mt-1">⏳ Loading {a?.domain} summary…</div>;
      }
      const entries = Object.entries(a?.summary ?? {}).slice(0, 4);
      return (
        <div className="mt-1 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800 space-y-0.5">
          <p className="font-semibold">📋 {a?.domain} summary</p>
          {entries.map(([k, v]) => (
            <p key={k}><span className="text-emerald-600">{k}:</span> {String(v)}</p>
          ))}
        </div>
      );
    },
  });

  // ── useLazyToolRenderer ───────────────────────────────────────────────────────
  const lazyRender = useLazyToolRenderer();
  void lazyRender; // prevent unused-variable lint — available for advanced usage

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 py-4">
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold">CopilotChat · Custom Renderers</h1>
          <p className="text-slate-600 mt-1 max-w-3xl">
            Demonstrates <code>CopilotChat</code> with custom <code>AssistantMessage</code> / <code>UserMessage</code> render props,{" "}
            <code>useChatContext</code>, <code>useRenderToolCall</code>,{" "}
            <code>useLazyToolRenderer</code>, and <code>useCopilotMessagesContext</code>.
          </p>
        </header>

        <div className="flex gap-2 flex-wrap items-center">
          {["finance", "hr", "healthcare", "wireless"].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDomain(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                activeDomain === d
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-1">(changes suggestions via useCopilotChatSuggestions)</span>
        </div>
      </div>

      {/* CopilotChat with fixed height */}
      <div className="rounded-xl border border-slate-200 bg-white custom-chat-container overflow-hidden" style={{ height: "calc(100vh - 350px)", minHeight: "500px", maxHeight: "700px" }}>
        <CopilotChat
          instructions={`You are a multi-domain data assistant. Active domain: ${activeDomain}. Use tools to fetch real data.`}
          labels={{
            title: "Custom Chat View",
            initial: `Hi! I'm using custom message renderers + useChatContext. Ask me about ${activeDomain} data!`,
          }}
          AssistantMessage={(props) => {
            let content = '';
            if (typeof props.message.content === 'string') {
              content = props.message.content;
            } else if (Array.isArray(props.message.content)) {
              const textPart = (props.message.content as any[]).find((c: any) => c.type === 'text');
              content = (textPart as any)?.text || '';
            }
            
            // Only render if we have content
            if (!content) return null;
            
            return (
              <div className="flex items-start gap-2 my-2">
                <span className="text-lg mt-0.5">🤖</span>
                <div className="rounded-xl rounded-tl-none bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 max-w-[75%] shadow-sm whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            );
          }}
          UserMessage={(props) => {
            let content = '';
            if (typeof props.message.content === 'string') {
              content = props.message.content;
            } else if (Array.isArray(props.message.content)) {
              const textPart = (props.message.content as any[]).find((c: any) => c.type === 'text');
              content = (textPart as any)?.text || '';
            }
            
            // Only render if we have content
            if (!content) return null;
            
            return (
              <div className="flex items-start gap-2 my-2 justify-end">
                <div className="rounded-xl rounded-tr-none bg-blue-600 px-3 py-2 text-sm text-white max-w-[75%] shadow-sm whitespace-pre-wrap">
                  {content}
                </div>
                <span className="text-lg mt-0.5">👤</span>
              </div>
            );
          }}
        >
          {/* useChatContext is available here since we're inside CopilotChat */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
            <ChatContextPanel />
          </div>
        </CopilotChat>
      </div>

      {/* Live message stats */}
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Message Stats — <code className="text-slate-500">useCopilotMessagesContext</code>
        </p>
        <MessageStats />
      </section>
    </div>
  );
}
