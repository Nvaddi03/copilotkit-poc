"use client";

import { useState } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { A2UICatalog, type A2UISpec } from "../../components/A2UICatalog";

/**
 * L4 · Declarative Generative UI.
 * The agent emits a list of { component, props } specs and the frontend
 * decides how to render each. The frontend exposes a *single* action.
 */
export default function DeclarativePage() {
  console.log("[DeclarativePage] RENDER");
  const [specs, setSpecs] = useState<A2UISpec[]>([]);
  console.log("[DeclarativePage] current specs state:", specs);

  useCopilotAction({
    name: "renderUI",
    description:
      "Render UI declaratively. Provide an array of component specs. Allowed components: Stat, Pie, Chart, Table, Callout. Use 'Chart' for ANY chart type — set props.kind to one of pie|donut|bar|hbar|line|area|scatter and pass data as [{name, value, ...extraSeries}]. Multi-series charts: add extra numeric keys to each datum (e.g. {name:'Jan', revenue:120, cost:80}) and optionally pass props.series to control which keys are plotted.",
    parameters: [
      {
        name: "specs",
        type: "object[]",
        required: true,
        description:
          "Array of { component, props }. Examples: " +
          "{component:'Stat', props:{label:'Total', value:1234}}; " +
          "{component:'Chart', props:{kind:'bar', title:'Headcount by dept', data:[{name:'Eng', value:42},{name:'Sales', value:28}]}}; " +
          "{component:'Chart', props:{kind:'line', title:'Monthly revenue', data:[{name:'Jan', revenue:120, cost:80}, ...], series:['revenue','cost']}}; " +
          "{component:'Table', props:{columns:['x','y'], rows:[[1,2]]}}; " +
          "{component:'Callout', props:{tone:'info', text:'…'}}",
      },
    ],
    handler: async ({ specs }) => {
      console.log("[renderUI] HANDLER CALLED with specs:", specs);
      console.log("[renderUI] typeof specs:", typeof specs, "isArray:", Array.isArray(specs));
      try {
        const arr = specs as A2UISpec[];
        console.log("[renderUI] setting", arr?.length, "specs");
        setSpecs(arr);
        return `Rendered ${arr.length} components`;
      } catch (e) {
        console.error("[renderUI] ERROR in handler:", e);
        return `Error: ${String(e)}`;
      }
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">L4 · Declarative Generative UI</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          The agent describes the UI as a JSON spec and the frontend picks
          components from a catalog (Stat, Pie, Table, Callout). Try:{" "}
          <em>“Build a finance dashboard”</em> or{" "}
          <em>“Summarize wireless usage with stats and a callout”</em>.
        </p>
      </header>

      {specs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Ask the copilot to build a dashboard.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {specs.map((s, i) => (
            <A2UICatalog key={i} spec={s} />
          ))}
        </div>
      )}

      <CopilotPopup
        defaultOpen
        instructions={`CRITICAL: On this page the ONLY UI rendering tool available is "renderUI". The tools "showChart", "showPieChart", and "renderDomainSummary" DO NOT EXIST here — never call them. To put ANYTHING on screen (chart, stat, table, callout) you MUST call renderUI(specs=[…]). If you do not call renderUI, the user sees nothing.

HARD RULES:
- For any chart/visualization request you MUST end your turn with exactly ONE renderUI call containing at least one {component:"Chart", props:{...}} spec.
- Do NOT call select_all_rows or summarize_table more than ONCE on the same table per user turn. After you have the rows you need, IMMEDIATELY aggregate them yourself and call renderUI. Do not keep re-fetching.
- Never reply with only prose for a chart request. Prose alone = failure.

Spec catalog:
- { component: "Stat",   props: { label, value } }
- { component: "Chart",  props: { kind, title?, data: [{name, value, ...moreSeries}], series?, xLabel?, yLabel? } }
     kind ∈ "pie" | "donut" | "bar" | "hbar" | "line" | "area" | "scatter"
     • Pie/donut/bar/line/area: each datum needs { name, value }. For multi-series use {name, seriesA, seriesB,...} + series:["seriesA","seriesB"].
     • Scatter: each datum is { name, x, y } and set series:["x","y"].
- { component: "Table",   props: { columns: string[], rows: (string|number)[][] } }
- { component: "Callout", props: { tone: "info"|"success"|"warn", text } }

Workflow:
1. Call ONE backend tool (e.g. select_all_rows("hr_employees")) to get raw rows.
2. Aggregate in your head (e.g. count rows per department).
3. Call renderUI ONCE with the resulting Chart spec.
4. Reply with a short confirmation sentence.

Example for "Bar chart of headcount by department":
  select_all_rows("hr_employees")  →  group by department, count  →
  renderUI(specs=[{component:"Chart", props:{kind:"bar", title:"Headcount by department", data:[{name:"Engineering",value:12},{name:"Sales",value:8},...]}}])

Use plain numbers in data (no "$", no commas, no "%").`}
        labels={{ title: "Declarative GenUI", initial: "Ask me to build a dashboard or any chart!" }}
      />
    </div>
  );
}
