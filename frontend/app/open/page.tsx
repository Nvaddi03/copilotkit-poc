// L5 demo: Open Generative UI (openGenerativeUI + MCP)
// (Implementation will be added after planning)

"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";

/**
 * L5 · Open Generative UI.
 * No pre-declared, typed components. We expose a single very generic
 * "renderMarkdown" action and let the agent stream rich markdown that
 * renders inline in the chat (CopilotKit auto-renders markdown).
 * For real MCP / open GenUI you'd wire openGenerativeUI here.
 */
export default function OpenGenUIPage() {
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
    <div className="grid md:grid-cols-[1fr,420px] gap-6">
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold">L5 · Open Generative UI</h1>
          <p className="text-slate-600 mt-1 max-w-2xl">
            The agent is free to render arbitrary inline UI via{" "}
            <code>renderMarkdown</code>. Combine with MCP tools on the
            backend for truly open generative experiences.
          </p>
        </header>
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
          Inline generative output will appear inside the chat on the right.
        </div>
      </div>

      <div className="h-[70vh] rounded-xl border border-slate-200 bg-white overflow-hidden">
        <CopilotChat
          instructions="You can call renderMarkdown to draw any inline UI/markdown for the user. Use it liberally for summaries, plans, and tables."
          labels={{ title: "Open GenUI", initial: "Ask me anything!" }}
        />
      </div>
    </div>
  );
}
