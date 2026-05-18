"use client";

import { useState } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

/**
 * RAG Demo Page
 *
 * Demonstrates Retrieval-Augmented Generation using FAISS vector search
 * over domain knowledge documents (Finance, HR, Healthcare, Wireless).
 *
 * The search_documents tool on the backend embeds the query and retrieves
 * the top-k relevant chunks. The agent cites sources in its answers.
 */

const SAMPLE_QUERIES = [
  { category: "Finance", q: "What is the budget approval threshold for a VP?", icon: "💰" },
  { category: "Finance", q: "What are the key financial KPI targets?", icon: "💰" },
  { category: "HR", q: "How many days of parental leave do we get?", icon: "👥" },
  { category: "HR", q: "What is the salary band for a senior (L3) engineer?", icon: "👥" },
  { category: "Healthcare", q: "What are the HIPAA breach notification requirements?", icon: "🏥" },
  { category: "Healthcare", q: "What is the target patient satisfaction score?", icon: "🏥" },
  { category: "Wireless", q: "What does the Premium plan include?", icon: "📡" },
  { category: "Wireless", q: "What is the primary reason customers churn?", icon: "📡" },
];

type SearchResult = { source: string; content: string };

export default function RAGPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState("");

  // ── useCopilotReadable with parentId hierarchy ─────────────────────────
  // Parent node describes the RAG session; children are scoped under it.
  // This demonstrates the parentId / hierarchical context tree feature.
  const ragSessionId = useCopilotReadable({
    description: "RAG knowledge search session",
    value: { sessionType: "rag-demo", timestamp: new Date().toISOString() },
  });

  useCopilotReadable({
    description: "Last query sent to the knowledge base",
    value: lastQuery || "(none yet)",
    parentId: ragSessionId,
    available: lastQuery ? "enabled" : "disabled", // disabled until first query
  });

  useCopilotReadable({
    description: "RAG search results currently displayed on screen",
    value: results.length ? results : "No search performed yet",
    parentId: ragSessionId,
  });

  // Allow agent to display search results it found in the side panel
  useCopilotAction({
    name: "showSearchResults",
    description: "Display document search results in the results panel.",
    parameters: [
      { name: "query", type: "string", required: true, description: "The query that was searched" },
      {
        name: "results",
        type: "object[]",
        required: true,
        description: "Array of {source:string, content:string} from search_documents",
      },
    ],
    handler: async ({ query, results: res }) => {
      setLastQuery(query as string);
      setResults((res as SearchResult[]) || []);
      return `Displayed ${(res as SearchResult[]).length} results for: ${query}`;
    },
  });

  const sourceColor: Record<string, string> = {
    "finance-policy": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "hr-policy": "bg-violet-50 text-violet-700 border-violet-200",
    "healthcare-compliance": "bg-rose-50 text-rose-700 border-rose-200",
    "wireless-plans": "bg-cyan-50 text-cyan-700 border-cyan-200",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">🔍 RAG — Retrieval-Augmented Generation</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          The agent uses FAISS vector search to find relevant policy and domain knowledge before answering.
          Ask any question about Finance, HR, Healthcare, or Wireless — it searches the docs first.
        </p>
      </header>

      {/* Architecture card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">📐 Architecture</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {["User question", "→", "Agent calls search_documents(query)", "→", "FAISS similarity search", "→", "Top-4 chunks retrieved", "→", "Agent answers with context + sources"].map((step, i) => (
            <span
              key={i}
              className={step === "→" ? "text-slate-400" : "px-2 py-1 rounded-lg bg-slate-50 border border-slate-200"}
            >
              {step}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Finance Policy", icon: "💰", color: "bg-emerald-50 text-emerald-700" },
            { label: "HR Handbook", icon: "👥", color: "bg-violet-50 text-violet-700" },
            { label: "Healthcare Compliance", icon: "🏥", color: "bg-rose-50 text-rose-700" },
            { label: "Wireless Plans", icon: "📡", color: "bg-cyan-50 text-cyan-700" },
          ].map((doc) => (
            <div key={doc.label} className={`rounded-lg px-3 py-2 ${doc.color} text-xs font-medium flex items-center gap-1.5`}>
              {doc.icon} {doc.label}
            </div>
          ))}
        </div>
      </div>

      {/* Sample queries */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Try these queries in the chat →
        </h3>
        <div className="grid md:grid-cols-2 gap-2">
          {SAMPLE_QUERIES.map((sq) => (
            <div
              key={sq.q}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-start gap-3 cursor-default hover:border-slate-300 hover:shadow-sm transition"
            >
              <span className="text-lg mt-0.5">{sq.icon}</span>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{sq.category}</span>
                <p className="text-sm text-slate-700 mt-0.5">{sq.q}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results panel */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Retrieved Chunks ({results.length}) — query: &quot;{lastQuery}&quot;
            </h3>
            <button
              onClick={() => setResults([])}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      sourceColor[r.source] || "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {r.source}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <CopilotPopup
        defaultOpen
        instructions={`You are a knowledge assistant with access to semantic document search.

When the user asks ANY question about policies, plans, compliance, KPIs, or guidelines:
1. ALWAYS call search_documents(query) first to find relevant context
2. Answer based on the retrieved chunks — cite which document they came from
3. After answering, call showSearchResults(query, results) to display the chunks in the panel

Available document sources:
- finance-policy: budget thresholds, KPI targets, cost center breakdown
- hr-policy: leave policies, salary bands, performance review cycle, headcount
- healthcare-compliance: HIPAA requirements, patient metrics, insurance mix
- wireless-plans: plan details, pricing, network performance, churn analysis

Always be specific and cite the source. If the user asks for data (numbers from the database), use the SQL tools normally.`}
        labels={{
          title: "RAG Knowledge Assistant",
          initial: "👋 Ask me anything about company policies, KPI targets, plan details, or compliance requirements. I'll search the knowledge base first!",
        }}
      />
    </div>
  );
}
