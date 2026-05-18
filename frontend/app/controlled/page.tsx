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
 */
export default function ControlledPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [pie, setPie] = useState<{ title: string; data: PieDatum[] } | null>(null);

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">L3 · Controlled Generative UI</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          The frontend pre-declares strongly-typed components. The agent
          decides <em>when</em> to render them and with <em>what data</em>. Try:{" "}
          <em>“Show 3 flight options from BLR to SFO”</em> or{" "}
          <em>“Show a pie chart of HR departments”</em>.
        </p>
      </header>

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
        instructions="You can render UI on the page by calling the showFlightOptions or showPieChart actions. Always prefer rendering UI rather than dumping JSON."
        labels={{ title: "Controlled GenUI", initial: "Ask me to render something!" }}
      />
    </div>
  );
}
