"use client";

import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

/**
 * L5 · Multi-Agent Routing
 *
 * Demonstrates CopilotKit's ability to switch the active agent dynamically.
 * Each domain routes to a specialist LangGraph agent with a focused tool set
 * and tailored system prompt — no generalist prompt needed.
 *
 * Pattern: <CopilotKit agent={activeAgent}> — the agent prop controls which
 * backend agent handles the conversation. Switching agent starts a fresh
 * context with the specialist.
 */

const AGENTS = [
  {
    id: "finance-agent",
    label: "Finance",
    icon: "💰",
    color: "from-emerald-500 to-emerald-700",
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    description: "P&L, budgets, accounts, transactions",
    initialMessage: "Ask about budgets, accounts, transactions, or request a finance summary.",
    suggestions: ["Finance summary", "Top 5 accounts by balance", "Monthly transaction trend"],
  },
  {
    id: "hr-agent",
    label: "HR",
    icon: "👥",
    color: "from-violet-500 to-violet-700",
    border: "border-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    description: "Headcount, payroll, attrition, policies",
    initialMessage: "Ask about employees, payroll, attrition rates, or HR policies.",
    suggestions: ["HR summary", "Headcount by department", "What is the parental leave policy?"],
  },
  {
    id: "healthcare-agent",
    label: "Healthcare",
    icon: "🏥",
    color: "from-rose-500 to-rose-700",
    border: "border-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    description: "Patients, appointments, compliance",
    initialMessage: "Ask about patients, appointment metrics, or HIPAA compliance requirements.",
    suggestions: ["Healthcare summary", "Patients by status", "What are HIPAA breach notification rules?"],
  },
  {
    id: "wireless-agent",
    label: "Wireless",
    icon: "📡",
    color: "from-cyan-500 to-cyan-700",
    border: "border-cyan-500",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    description: "Subscribers, usage, churn, plans",
    initialMessage: "Ask about subscribers, data usage, churn analysis, or wireless plan details.",
    suggestions: ["Wireless summary", "Subscribers by plan type", "What are the current plan prices?"],
  },
];

function AgentCard({
  agent,
  isActive,
  onClick,
}: {
  agent: (typeof AGENTS)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
        isActive
          ? `${agent.border} ${agent.bg} shadow-lg scale-[1.02]`
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full animate-pulse ${agent.bg.replace("50", "500")}`} />
          <span className={`text-xs font-semibold ${agent.text}`}>Active</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl`}>
          {agent.icon}
        </div>
        <div>
          <p className="font-bold text-slate-900">{agent.label} Specialist</p>
          <p className="text-xs text-slate-500">{agent.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {agent.suggestions.map((s) => (
          <span
            key={s}
            className={`text-xs px-2 py-0.5 rounded-full border ${
              isActive ? `${agent.bg} ${agent.border} ${agent.text}` : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function MultiAgentPage() {
  const [activeAgentId, setActiveAgentId] = useState("finance-agent");
  const activeAgent = AGENTS.find((a) => a.id === activeAgentId)!;

  return (
    // Re-mount CopilotKit when agent changes — fresh context per specialist
    <CopilotKit
      key={activeAgentId}
      runtimeUrl="/api/copilotkit"
      agent={activeAgentId}
      headers={{
        "x-user-id": "demo-user",
        "x-session": "multi-agent-demo",
        "x-app-version": "1.0.0",
      }}
    >
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left panel: agent selector */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-5 overflow-y-auto">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">🤖 Agent Routing</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a specialist — each routes to a dedicated LangGraph agent with domain-focused tools.
            </p>
          </div>

          <div className="space-y-3">
            {AGENTS.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActive={activeAgentId === agent.id}
                onClick={() => setActiveAgentId(agent.id)}
              />
            ))}
          </div>

          {/* How it works panel */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">⚙️ How it works</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>→ Each agent runs a separate LangGraph graph</li>
              <li>→ Specialist tools only (e.g. <code>finance_summary</code>)</li>
              <li>→ Tailored system prompt per domain</li>
              <li>→ RAG search over domain docs included</li>
              <li>→ Switching resets the conversation context</li>
            </ul>
          </div>
        </div>

        {/* Right: CopilotSidebar taking remaining height */}
        <div className="flex-1 relative overflow-hidden">
          <div className={`absolute inset-0 flex flex-col`}>
            {/* Active agent banner */}
            <div className={`flex items-center gap-3 px-5 py-3 border-b border-slate-200 ${activeAgent.bg}`}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeAgent.color} flex items-center justify-center text-base`}>
                {activeAgent.icon}
              </div>
              <div>
                <p className={`font-semibold text-sm ${activeAgent.text}`}>
                  {activeAgent.label} Specialist Agent
                </p>
                <p className="text-xs text-slate-500">{activeAgent.id}</p>
              </div>
            </div>

            {/* Inline chat */}
            <div className="flex-1 overflow-hidden">
              <CopilotSidebar
                defaultOpen
                clickOutsideToClose={false}
                instructions={`You are the ${activeAgent.label} specialist. Focus exclusively on ${activeAgent.label.toLowerCase()} data and ${activeAgent.description}. Use your domain tools to answer accurately. Also use search_documents when the user asks about policies, plans, or compliance.`}
                labels={{
                  title: `${activeAgent.icon} ${activeAgent.label} Agent`,
                  initial: activeAgent.initialMessage,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </CopilotKit>
  );
}
