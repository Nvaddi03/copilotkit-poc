"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction, useLangGraphInterrupt } from "@copilotkit/react-core";
import { useRef, useState } from "react";

/**
 * HITL · Human-in-the-Loop Demo.
 *
 * Demonstrates the CopilotKit HITL pattern:
 * - `handler` creates a Promise and awaits user input.
 * - `render` shows a blocking Approve/Reject UI while the agent is paused.
 * - The user's click resolves the Promise and the agent continues.
 *
 * Pattern: useRef stores the Promise resolver; render reads from it via state.
 */
export default function HITLPage() {
  const [log, setLog] = useState<string[]>([]);

  // ── Export approval ──────────────────────────────────────────────────
  const exportResolveRef = useRef<((approved: boolean) => void) | null>(null);

  useCopilotAction({
    name: "executeDataExport",
    description:
      "Export data from a domain table. This is IRREVERSIBLE — always pause for human approval first.",
    parameters: [
      { name: "domain",    type: "string", required: true },
      { name: "table",     type: "string", required: true },
      { name: "row_count", type: "number", required: false },
    ],
    // render shows the blocking approval UI while handler is awaiting
    render: ({ args, status }) => {
      if (status === "complete") {
        return (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            ✅ Export action completed.
          </div>
        );
      }
      if (status === "executing") {
        return (
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5 space-y-3 shadow">
            <p className="text-amber-800 font-semibold text-base">⚠️ Human Approval Required — Export</p>
            <div className="text-sm text-amber-900 space-y-1">
              <p><strong>Table:</strong> <code>{String(args.table ?? "—")}</code></p>
              <p><strong>Domain:</strong> {String(args.domain ?? "—")}</p>
              {args.row_count != null && <p><strong>Rows:</strong> {String(args.row_count)}</p>}
              <p className="text-xs text-amber-600">The agent is paused and waiting for your decision.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportResolveRef.current?.(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => exportResolveRef.current?.(false)}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-300 text-sm font-medium hover:bg-red-200 transition"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        );
      }
      return null;
    },
    handler: async ({ domain, table, row_count }) => {
      // Create a Promise that only resolves when the user clicks Approve/Reject
      const approved = await new Promise<boolean>((resolve) => {
        exportResolveRef.current = resolve;
      });
      exportResolveRef.current = null;

      if (!approved) {
        setLog((p) => [`[${new Date().toLocaleTimeString()}] ❌ Export of ${table} rejected`, ...p]);
        return "Export was rejected by the user. Do NOT proceed.";
      }
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✅ Export of ${table} (${domain}) approved`, ...p]);
      return `Export of "${table}" from domain "${domain}" approved and executed successfully.`;
    },
  });

  // ── Budget approval ──────────────────────────────────────────────────
  const budgetResolveRef = useRef<((approved: boolean) => void) | null>(null);

  useCopilotAction({
    name: "approveBudgetChange",
    description:
      "Request approval for a budget change. Always pause for human review before making budget modifications.",
    parameters: [
      { name: "department", type: "string", required: true },
      { name: "amount",     type: "number", required: true  },
      { name: "reason",     type: "string", required: false },
    ],
    render: ({ args, status }) => {
      if (status === "complete") {
        return (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            ✅ Budget decision recorded.
          </div>
        );
      }
      if (status === "executing") {
        return (
          <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5 space-y-3 shadow">
            <p className="text-blue-800 font-semibold text-base">💰 Budget Approval Required</p>
            <div className="text-sm text-blue-900 space-y-1">
              <p><strong>Department:</strong> {String(args.department ?? "—")}</p>
              <p><strong>Amount:</strong> ${Number(args.amount ?? 0).toLocaleString()}</p>
              {args.reason && <p><strong>Reason:</strong> {String(args.reason)}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => budgetResolveRef.current?.(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => budgetResolveRef.current?.(false)}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-300 text-sm font-medium hover:bg-red-200 transition"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        );
      }
      return null;
    },
    handler: async ({ department, amount, reason }) => {
      const approved = await new Promise<boolean>((resolve) => {
        budgetResolveRef.current = resolve;
      });
      budgetResolveRef.current = null;

      if (!approved) {
        setLog((p) => [`[${new Date().toLocaleTimeString()}] ❌ Budget rejected: ${department}`, ...p]);
        return `Budget change for ${department} was rejected by the user.`;
      }
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✅ Budget approved: ${department} $${amount}`, ...p]);
      return `Budget change for ${department} ($${amount}) approved and applied.`;
    },
  });

  // ── useLangGraphInterrupt ────────────────────────────────────────────
  // Native LangGraph interrupt pattern — listens for __interrupt__ events
  // from a LangGraph node and renders a custom approval UI.
  // This is the V2 recommended approach when your graph uses interrupt().
  useLangGraphInterrupt({
    render: ({ event, resolve }) => {
      const value = (event as any)?.value ?? (event as any)?.data ?? event;
      const message = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      return (
        <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-5 space-y-3 shadow my-2">
          <p className="text-rose-800 font-semibold">🛑 LangGraph Interrupt</p>
          <p className="text-sm text-rose-700 font-mono whitespace-pre-wrap">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => resolve("approved")}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => resolve("rejected")}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      );
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">HITL · Human-in-the-Loop</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          Sensitive actions <strong>pause the agent</strong> and render a blocking approval UI
          inside the chat. The agent cannot continue until you click{" "}
          <strong>Approve</strong> or <strong>Reject</strong>. Powered by{" "}
          <code>useCopilotAction</code> with a <code>render</code> prop + Promise-based
          suspension in the <code>handler</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded">
            Try: <em>"Export all finance transactions"</em>
          </span>
          <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">
            Try: <em>"Approve a $50,000 budget increase for Engineering"</em>
          </span>
        </div>
      </header>

      {/* Approval log */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-800 mb-3">📋 Approval Log</h2>
        {log.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No approvals yet. Trigger an action via the chat.</p>
        ) : (
          <ul className="space-y-1 text-sm font-mono text-slate-700">
            {log.map((entry, i) => (
              <li key={i} className="border-b border-slate-100 pb-1">{entry}</li>
            ))}
          </ul>
        )}
      </div>

      <CopilotPopup
        defaultOpen
        instructions={`You are a HITL (Human-in-the-Loop) demo assistant. 
When the user asks to export data, call executeDataExport.
When the user asks to approve/modify a budget, call approveBudgetChange.
These actions will PAUSE your execution and show an approval UI.
Do NOT summarise the outcome until after the approval UI resolves.`}
        labels={{
          title: "HITL Approvals",
          initial: "I'll pause for your approval before any sensitive action. Try: 'Export finance transactions' 🛑",
        }}
      />
    </div>
  );
}
