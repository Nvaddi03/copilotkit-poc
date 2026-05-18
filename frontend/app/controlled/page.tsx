"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { FlightCard, type Flight } from "../../components/FlightCard";
import { GenPieChart, type PieDatum } from "../../components/PieChart";
import { useState } from "react";

/**
 * L3 · Controlled Generative UI.
 * Frontend declares typed actions; the agent calls them, and we render
 * specific, hard-coded React components (FlightCard, PieChart).
 *
 * Also demonstrates useFrontendTool — a browser-only action that never
 * reaches the backend (clipboard copy).
 */
export default function ControlledPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [pie, setPie] = useState<{ title: string; data: PieDatum[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useCopilotAction({
    name: "showFlightOptions",
    description:
      "Render a list of flight option cards to the user. Use this when the user is browsing flights.",
    parameters: [
      {
        name: "flights",
        type: "object[]",
        required: true,
        description:
          "Array of flight objects: {airline, flightNumber, from, to, depart, arrive, price}",
      },
    ],
    handler: async ({ flights }) => {
      setFlights(flights as Flight[]);
      return `Rendered ${(flights as Flight[]).length} flight cards`;
    },
  });

  useCopilotAction({
    name: "showPieChart",
    description:
      "Render a pie chart for the requested distribution (e.g. department headcount, transaction categories).",
    parameters: [
      { name: "title", type: "string", required: true },
      {
        name: "data",
        type: "object[]",
        required: true,
        description: "Array of {name, value} datums.",
      },
    ],
    handler: async ({ title, data }) => {
      setPie({ title: String(title), data: data as PieDatum[] });
      return "Pie chart rendered";
    },
  });

  // ── useFrontendTool ──────────────────────────────────────────────────
  // This action runs 100% in the browser — it never calls the backend.
  // The agent can call it to copy any text to the user's clipboard.
  useCopilotAction({
    name: "copyToClipboard",
    description:
      "Copy a text summary to the user's clipboard. Use when the user asks to copy a result, flight detail, or any text. This is a FRONTEND-ONLY tool — never calls the backend.",
    parameters: [
      { name: "text",  type: "string", required: true,  description: "The text to copy." },
      { name: "label", type: "string", required: false, description: "Short label shown in the toast." },
    ],
    handler: async ({ text, label }) => {
      try {
        await navigator.clipboard.writeText(String(text));
        setCopied(String(label ?? "Result"));
        setTimeout(() => setCopied(null), 2500);
        return "Copied to clipboard.";
      } catch {
        return "Clipboard write failed — browser may require HTTPS or a user gesture.";
      }
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">L3 · Controlled Generative UI</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          The frontend pre-declares strongly-typed components. The agent
          decides <em>when</em> to render them and with <em>what data</em>. Try:{" "}
          <em>"Show 3 flight options from BLR to SFO"</em> or{" "}
          <em>"Show a pie chart of HR departments"</em>.
          <br />
          <span className="text-xs text-slate-400 mt-1 block">
            💡 Also try: <em>"Copy the flight list to clipboard"</em> — powered by{" "}
            <code>useFrontendTool</code> (browser-only, no backend call).
          </span>
        </p>
      </header>

      {/* Clipboard toast */}
      {copied && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          ✅ <strong>{copied}</strong> copied to clipboard!
        </div>
      )}

      {pie && <GenPieChart title={pie.title} data={pie.data} />}

      <div className="grid md:grid-cols-2 gap-3">
        {flights.map((f, i) => (
          <FlightCard key={i} flight={f} />
        ))}
      </div>

      {!pie && flights.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No UI rendered yet. Open the chat and ask the copilot to show flights
          or a pie chart.
        </div>
      )}

      <CopilotPopup
        defaultOpen
        instructions="You can render UI by calling showFlightOptions or showPieChart. You can also call copyToClipboard(text, label) to copy any result to the user's clipboard — this runs only in the browser, never on the backend. Always prefer rendering UI rather than dumping JSON."
        labels={{
          title: "Controlled GenUI",
          initial: "Ask me to render something! Try 'Show 3 flights from BLR to SFO' or 'Copy a finance summary to clipboard'.",
        }}
      />
    </div>
  );
}
