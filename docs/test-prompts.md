# 🧪 CopilotKit POC · Test Prompts

A curated set of prompts to exercise **every CopilotKit primitive** in the POC.
Organised by page → category → sample prompts. Copy/paste into the relevant chat.

> **Stack:** Next.js 14 · FastAPI + LangGraph · `@copilotkit` v1.10.5  
> **Agents:** `copilotkit-agent`, `finance-agent`, `hr-agent`, `healthcare-agent`, `wireless-agent`  
> Each page registers its own `useCopilotAction` set — the agent only sees the actions on the current page.

---

## Scoreboard · 50 / 67 features = 75%

| ✅ Done | 🔷 N/A | 🔷 OSS Only | ❌ Todo |
|--------|--------|------------|--------|
| 50     | 11     | 6          | 0      |

---

## 1. Dashboard · `http://localhost:3000/`

**UI Component:** `CopilotSidebar`  
**CopilotKit Primitives:** `useCopilotReadable`, `useCopilotAction`, `CopilotObservabilityHooks`, `CopilotTask`, `threadId` localStorage persistence  
**Registered actions:** `selectDomain`, `renderDomainSummary`, `showChart`, `showPieChart`, `clearCharts`

### 1.1 Plain Q&A (no UI render)
- `What tables are in the database?`
- `What columns does the employees table have?`
- `How many rows are in the transactions table?`
- `Which domains do you support?`

### 1.2 Domain summaries (→ `renderDomainSummary` card + `selectDomain`)
- `Give me the finance summary.`
- `Summarize HR.`
- `Show the healthcare summary and switch the active domain to healthcare.`
- `Summarize wireless usage.`
- `Switch to wireless.`

### 1.3 Charts — Bar, Line, Area, Scatter
- `Bar chart of headcount by department.`
- `Bar chart: row counts for every table.`
- `Line chart of monthly transaction amounts for the last 12 months.`
- `Area chart of weekly wireless usage.`
- `Scatter plot of employee tenure vs salary.`

### 1.4 Pie / Donut charts
- `Pie chart of the finance summary.`
- `Donut chart comparing total balance vs total transaction amount.`
- `Donut of wireless customers vs total usage records.`

### 1.5 Multi-series / combo
- `Bar chart of revenue vs cost by month for the last 6 months.`
- `Switch to finance, summarize it, and show a donut of the balance breakdown.`
- `Show the HR summary and a bar chart of headcount by department in one go.`
- `Clear all charts.`

### 1.6 CopilotObservabilityHooks — watch the amber event log panel
- Send any message → look for **onMessageSent** entry in the amber panel  
- Minimize the sidebar → look for **onChatMinimized**  
- Re-open it → look for **onChatExpanded**  
- Click the thumbs-up on a response → look for **onFeedbackGiven**

### 1.7 threadId persistence
- Open DevTools → Application → Local Storage → `copilotkit-poc-thread-id`  
- Refresh the page → the same thread ID should still be present

---

## 2. Controlled GenUI · `http://localhost:3000/controlled`

**UI Component:** `CopilotPopup`  
**CopilotKit Primitives:** L3 Controlled GenUI (`useCopilotAction` with strongly-typed `render`)  
**Registered actions:** `showFlightOptions`, `showPieChart`

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

## 3. Declarative GenUI · `http://localhost:3000/declarative`

**UI Component:** `CopilotPopup`  
**CopilotKit Primitives:** L4 Declarative GenUI (`buildDashboard` — typed `stats[]` + `charts[]`)  
**Registered actions:** `buildDashboard`

### 3.1 Single-component renders
- `Render a Stat card with the total number of patients.`
- `Render a Callout saying "Wireless ARPU dropped 4% MoM".`
- `Render a Table of the first 5 rows of the employees table.`

### 3.2 Agent picks chart kind
- `Visualize total balance vs total transaction amount.`  *(expect donut/pie)*
- `Visualize headcount by department.`  *(expect bar)*
- `Visualize monthly transactions over time.`  *(expect line/area)*

### 3.3 Full declarative dashboards
- `Build a finance dashboard.`
- `Build an HR dashboard with stats, a bar chart of headcount per department, and a callout summarising key risks.`
- `Build a healthcare dashboard: Stat for total patients, Stat for total appointments, Pie of appointments by status, Table of next 5 appointments, and an info Callout.`
- `Summarize wireless: donut of usage categories, two Stat cards (customers, total usage), and a Callout with a one-line insight.`

### 3.4 Stress / variety
- `Compare all four domains side-by-side: one Stat per domain plus a single bar chart of row counts.`
- `Build a dashboard that uses every component type at least once.`

---

## 4. Open GenUI · `http://localhost:3000/open`

**UI Component:** `CopilotChat` (inline)  
**CopilotKit Primitives:** L2 In-chat Streaming Render (`renderStreamingChart` with skeleton), L5 Open GenUI schema registry (`renderComponent`), `CopilotTextarea` autocompletion  
**Registered actions:** `renderStreamingChart`, `renderComponent`

### 4.1 L2 — Streaming chart with animated skeleton
- `Streaming bar chart of headcount by department.`
- `Show a streaming line chart of monthly transactions.`
- `Streaming area chart of wireless usage trends.`
- `Streaming pie chart of finance account balances.`

> Watch for the **animated skeleton** while the agent is still generating args (`status = "inProgress"`), then the real chart appears when complete.

### 4.2 L5 — Open GenUI `renderComponent` schema registry
- `Render a Stat component: label="Total Employees", value=142, delta="+5%", trend="up".`
- `Render an Alert component: type="warning", title="Budget Alert", message="Q3 spend is 94% of budget".`
- `Render a Badge: label="Finance", color="blue".`
- `Render a Progress bar: label="Q3 Target", value=74, max=100.`
- `Render a Timeline with 3 steps: Q1 Planning, Q2 Execution, Q3 Review.`

### 4.3 CopilotTextarea autocompletion
- Click inside the textarea at the bottom of the page  
- Start typing: `Generate a summary of...` → wait for grey ghost autocomplete  
- Press **Tab** to accept

### 4.4 Mixed
- `Pull the finance summary and render a Stat card for total balance plus a streaming bar chart of accounts.`

---

## 5. Human-in-the-Loop (HITL) · `http://localhost:3000/hitl`

**UI Component:** `CopilotSidebar`  
**CopilotKit Primitives:** `useCopilotAction` with `renderAndWait` (blocking approval step)  
**Registered actions:** `exportReport`, `setBudget`

### 5.1 Approve flow
- `Export a finance report.`  → click **Approve** in the confirmation card → watch success toast

### 5.2 Reject flow
- `Set the HR budget to $500,000.`  → click **Reject** → watch rejection message

### 5.3 Timeout / cancel
- `Export a healthcare report.`  → do NOT click anything for 30 s → observe the pending state

---

## 6. Chat Page · `http://localhost:3000/chat`

**UI Component:** `CopilotChat` (inline, custom CSS)  
**CopilotKit Primitives:** `useChatContext`, `useCopilotReadable`, `useCopilotAction`  
**Registered actions:** `renderHealthcareSummary`, `renderMessageStats`

### 6.1 Healthcare summaries
- `Give me a healthcare summary.`
- `How many appointments are scheduled vs completed?`
- `What are the top diagnoses?`

### 6.2 Message statistics
- `Show message stats for this session.`
- `How many messages have we exchanged?`

### 6.3 useChatContext inspection
- Ask any question → observe that `useChatContext` populates the sidebar metadata panel with message count and current agent

---

## 7. Multi-Agent · `http://localhost:3000/multiagent`

**UI Component:** `CopilotChat` (inline)  
**CopilotKit Primitives:** Multi-agent routing (`useCoAgent` / agent switching), `useCopilotReadable`  
**Agents:** `finance-agent`, `hr-agent`, `healthcare-agent`, `wireless-agent`

### 7.1 Agent-specific queries
- `What are the key finance KPIs?`  *(routes to finance-agent)*
- `List all HR departments and their headcount.`  *(routes to hr-agent)*
- `Summarize today's patient appointments.`  *(routes to healthcare-agent)*
- `What is the average wireless data usage per customer?`  *(routes to wireless-agent)*

### 7.2 Agent switching mid-conversation
- Ask a finance question → then: `Now switch to healthcare and tell me about HIPAA compliance.`
- `Compare finance revenue with HR headcount costs.`  *(may route to both agents)*

### 7.3 Handoff verification
- `Which agent are you?`  *(should identify itself correctly after each switch)*

---

## 8. RAG (Retrieval-Augmented Generation) · `http://localhost:3000/rag`

**UI Component:** `CopilotChat` (inline)  
**CopilotKit Primitives:** `useCopilotReadable` with `parentId` hierarchy + `available` flag, FAISS vector search  
**Tool:** `rag_tool` (FAISS in-memory)

### 8.1 Policy / HR document queries
- `What is the company policy on parental leave?`
- `What is the budget approval threshold?`
- `Summarize the Q3 financial guidance.`
- `What are the HIPAA data retention rules?`

### 8.2 Context hierarchy verification (useCopilotReadable parentId)
- Ask a RAG question → then: `What was the last query I ran?`  *(should surface the `lastQuery` readable)*
- `What search results did you find for my last question?`  *(surfaces `results` readable)*

### 8.3 Availability flag
- Clear the search results → then: `What were the previous search results?`  
  *(`available: "disabled"` should hide the `lastQuery` readable)*

---

## 9. Multimodal · `http://localhost:3000/multimodal`

**UI Component:** `CopilotChat` (inline)  
**CopilotKit Primitives:** Multimodal image input (`useFile` / base64 image attachment → GPT-4o vision)

### 9.1 Image drag-and-drop
- Drag any screenshot or chart PNG into the chat drop zone  
- `Describe what you see in this image.`
- `Identify any trends in this chart.`
- `Extract all text from this image.`

### 9.2 Image + data combo
- Drag a chart image → `Compare this with the finance data in the database.`
- Drag a screenshot → `Identify any anomalies and cross-reference with our wireless usage data.`

---

## 10. Voice · `http://localhost:3000/voice`

**UI Component:** Custom voice UI with `CopilotChat`  
**CopilotKit Primitives:** Browser `SpeechRecognition` (STT) + `SpeechSynthesis` (TTS)

### 10.1 Speech-to-Text
- Click the 🎙️ mic button → say `"What is the wireless plan price?"`  
- Transcript should appear in the input box → agent responds

### 10.2 Text-to-Speech
- Toggle TTS on → ask any question → agent response should be read aloud

### 10.3 Voice + data
- Say: `"Summarize finance"` → spoken response + domain card should render
- Say: `"Switch to HR"` → spoken confirmation + domain switch

---

## 11. Negative / Guard-rail Checks

Use these on **any page** to confirm the agent never falls back to "I can't render":

- `Make me a pie chart of the finance summary.`  *(must render, NOT suggest Excel)*
- `Visualize the HR data however you think is best.`  *(agent must pick a chart kind)*
- `Plot transactions over time.`  *(must call showChart/renderStreamingChart, kind=line/area)*
- `I need a dashboard.`  *(must call buildDashboard or renderComponent, not just describe)*

---

## 12. CopilotKit Primitives Coverage

| Primitive | Pages | Key Prompt |
|---|---|---|
| `CopilotKit` provider + `threadId` | all | *(implicit — check localStorage)* |
| `CopilotProvider` (client wrapper) | all | *(layout-level)* |
| `CopilotSidebar` | dashboard, hitl | any §1 prompt |
| `CopilotPopup` | controlled, declarative | any §2 or §3 prompt |
| `CopilotChat` (inline) | open, chat, multiagent, rag, multimodal, voice | any §4–§10 prompt |
| `CopilotTextarea` | open | §4.3 |
| `CopilotDevConsole` | all (dev only) | open DevConsole panel |
| `useCopilotReadable` + `parentId` | dashboard, rag | §1.1, §8.2 |
| `useCopilotReadable` + `available` flag | rag | §8.3 |
| `useCopilotAction` · handler | dashboard, controlled, hitl | §1, §2, §5 |
| `useCopilotAction` · `render` prop (L3) | controlled | §2.1 |
| `useCopilotAction` · `renderAndWait` (HITL) | hitl | §5 |
| `useCopilotAction` · streaming `render` (L2) | open | §4.1 |
| `useCopilotAction` · schema registry (L5) | open | §4.2 |
| `buildDashboard` declarative (L4) | declarative | §3 |
| `CopilotObservabilityHooks` (7 callbacks) | dashboard | §1.6 |
| `useChatContext` | chat | §6.3 |
| Multi-agent routing (`useCoAgent`) | multiagent | §7 |
| RAG + FAISS vector search | rag | §8 |
| Multimodal image (GPT-4o vision) | multimodal | §9 |
| Browser STT + TTS (voice) | voice | §10 |
| Backend `@tool` (LangGraph) | all | §1.1 |
| AG-UI HTTP streaming transport | all | *(transport layer)* |
