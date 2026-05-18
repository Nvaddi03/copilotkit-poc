# 🧪 CopilotKit POC · Test Prompts

A curated set of prompts to exercise **every CopilotKit primitive** in the POC.
Group by page → category → sample prompts. Copy/paste into the relevant chat.

> All four pages share the same backend agent (`copilotkit-agent`) but each
> page mounts a **different set of UI actions** via `useCopilotAction`. The
> agent only sees the actions registered on the page you're currently on.

---

## 1. Dashboard · http://localhost:3000/

Available UI actions: `selectDomain`, `renderDomainSummary`,
`showPieChart`, `showChart`, `clearCharts`.
Backend tools: all 8 (`list_tables`, `table_schema`, `select_all_rows`,
`summarize_table`, `finance_summary`, `hr_summary`, `healthcare_summary`,
`wireless_summary`).

### 1.1 Plain Q&A (no UI render)
- `What tables are in the database?`
- `What columns does the employees table have?`
- `How many rows are in the transactions table?`
- `Which domains do you support?`

### 1.2 Domain summaries (→ `renderDomainSummary` card updates)
- `Give me the finance summary.`
- `Summarize HR.`
- `Show the healthcare summary and switch the active domain to healthcare.`
- `Summarize wireless usage.`

### 1.3 Switch focus (→ `selectDomain`)
- `Switch to wireless.`
- `Focus on HR.`

### 1.4 Pie / donut (share-of-total)
- `Pie chart of the finance summary.`
- `Donut chart comparing total balance vs total transaction amount.`
- `Donut of wireless customers vs total usage records.`

### 1.5 Bar (categorical comparison)
- `Bar chart of headcount by department.`
- `Bar chart: row counts for every table.`
- `Horizontal bar of patient counts by appointment status.`

### 1.6 Line / area (trend)
- `Line chart of monthly transaction amounts for the last 12 months.`
- `Area chart of weekly wireless usage.`

### 1.7 Scatter (correlation)
- `Scatter plot of employee tenure vs salary.`

### 1.8 Multi-series
- `Bar chart of revenue vs cost by month for the last 6 months.`
- `Line chart of patient visits vs no-shows by month.`

### 1.9 Combo workflows
- `Switch to finance, summarize it, and show a donut of the balance breakdown.`
- `Show the HR summary and a bar chart of headcount by department in one go.`
- `Clear all charts.`

---

## 2. L3 · Controlled GenUI · http://localhost:3000/controlled

Available UI actions: `showFlightOptions`, `showPieChart`.
Components are **strongly typed** — the frontend, not the agent, picks the
shape.

### 2.1 Flight cards
- `Show 3 flight options from BLR to SFO under $900.`
- `Give me two morning flights from JFK to LHR on Delta.`
- `Suggest the cheapest flight from BOM to DXB tomorrow.`

### 2.2 Pie chart
- `Pie chart of HR departments.`
- `Pie chart: share of finance balance across the top 4 accounts.`
- `Pie of wireless plan types.`

### 2.3 Mix
- `Show me 3 flight options and a pie chart of their prices.`

---

## 3. L4 · Declarative GenUI · http://localhost:3000/declarative

Single UI action: `renderUI(specs[])`.
Catalog components: `Stat | Chart | Pie | Table | Callout`.
The **LLM** chooses both the layout *and* the chart kind.

### 3.1 Single-component renders
- `Render a Stat card with the total number of patients.`
- `Render a Callout (tone=warn) saying "Wireless ARPU dropped 4% MoM".`
- `Render a Table of the first 5 rows of the employees table.`

### 3.2 Single chart, agent picks the kind
- `Visualize total balance vs total transaction amount.`  *(expect donut/pie)*
- `Visualize headcount by department.`  *(expect bar)*
- `Visualize monthly transactions over time.`  *(expect line/area)*

### 3.3 Full declarative dashboards (multi-spec)
- `Build a finance dashboard.`
- `Build an HR dashboard with stats, a bar chart of headcount per department, and a callout summarising key risks.`
- `Build a healthcare dashboard: a Stat for total patients, a Stat for total appointments, a Pie of appointments by status, a Table of the next 5 appointments, and an info Callout.`
- `Summarize wireless: a donut of usage categories, two Stat cards (customers, total usage), and a Callout with a one-line insight.`

### 3.4 Stress / variety
- `Compare all four domains side-by-side: one Stat per domain plus a single bar chart of row counts.`
- `Build a dashboard that uses every component type at least once.`

---

## 4. L5 · Open GenUI · http://localhost:3000/open

Single UI action: `renderMarkdown(markdown)` with an inline `render` prop —
the agent freely streams arbitrary markdown into the chat thread.

### 4.1 Inline markdown rendering
- `Draft release notes for our last sprint as markdown.`
- `Write a 3-step migration plan from MySQL to Postgres.`
- `Produce a markdown table comparing the four domains by row count.`

### 4.2 Mixed prose + tool calls
- `Pull the finance summary and write an executive brief in markdown.`
- `Look at the HR table and write a 5-bullet hiring recommendation.`

---

## 5. Negative / guard-rail checks

Use these to confirm the agent **does not** revert to "I can't render charts":

- `Make me a pie chart of the finance summary.`  *(must render, NOT suggest Excel)*
- `Visualize the HR data however you think is best.`  *(agent must pick a kind)*
- `Plot transactions over time.`  *(must call showChart, kind=line/area)*

---

## 6. CopilotKit primitives covered by this list

| Primitive | Pages used | Sample prompt |
|---|---|---|
| `CopilotKit` provider | all | (implicit) |
| `CopilotSidebar` | dashboard | any §1 prompt |
| `CopilotPopup` | controlled, declarative | any §2 or §3 prompt |
| `CopilotChat` (inline) | open | any §4 prompt |
| `useCopilotReadable` | dashboard | "What domain am I on?" |
| `useCopilotAction` · handler | dashboard, controlled, declarative | §1, §2, §3 |
| `useCopilotAction` · `render` prop | open | §4 |
| Backend `@tool` (LangGraph) | all | §1.1, §1.2 |
| AG-UI HTTP streaming | all | (transport) |
| L3 controlled GenUI | controlled | §2 |
| L4 declarative GenUI | declarative + dashboard `showChart` | §1.4–1.9, §3 |
| L5 open GenUI | open | §4 |
