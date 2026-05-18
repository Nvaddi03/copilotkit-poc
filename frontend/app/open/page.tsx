"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotTextarea } from "@copilotkit/react-textarea";
import { useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";

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
        <h1 className="text-2xl font-bold">L5 · Open Generative UI + CopilotTextarea</h1>
        <p className="text-slate-600 mt-1 max-w-2xl">
          Two features in one page:
          <br />
          <strong>1. Open GenUI</strong> — the agent renders arbitrary markdown inline via{" "}
          <code>renderMarkdown</code>.
          <br />
          <strong>2. CopilotTextarea</strong> — an AI-enhanced textarea with live
          autocomplete suggestions based on your CopilotKit context.
        </p>
      </header>

      {/* ── CopilotTextarea demo ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="font-semibold text-slate-800 text-lg">
          ✏️ CopilotTextarea — AI-Enhanced Text Input
        </h2>
        <p className="text-sm text-slate-500">
          Start typing a business report or email. CopilotKit will suggest
          completions based on the active domain context. Press{" "}
          <kbd className="px-1 py-0.5 text-xs bg-slate-100 border rounded">Tab</kbd> to accept.
        </p>
        <CopilotTextarea
          value={textareaValue}
          onValueChange={setTextareaValue}
          placeholder="Start typing a business summary, email draft, or analysis…"
          className="w-full min-h-[140px] rounded-lg border border-slate-300 p-3 text-sm text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autosuggestionsConfig={{
            textareaPurpose:
              "Business report or summary for Finance, HR, Healthcare, or Wireless domain analysis.",
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
        <h2 className="font-semibold text-slate-800 text-lg">
          💬 Open Generative UI Chat
        </h2>
        <p className="text-sm text-slate-500">
          The agent renders arbitrary markdown inline. Try:{" "}
          <em>"Give me a formatted report on the healthcare domain"</em>.
        </p>
        <div className="h-[60vh] rounded-xl border border-slate-200 bg-white overflow-hidden">
          <CopilotChat
            instructions="You can call renderMarkdown to draw any inline UI/markdown for the user. Use it liberally for summaries, plans, and tables. Format responses as clean, structured markdown."
            labels={{ title: "Open GenUI", initial: "Ask me anything! I'll render rich markdown inline." }}
          />
        </div>
      </section>
    </div>
  );
}
