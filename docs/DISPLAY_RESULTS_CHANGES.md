# 🎨 How We Display Results & Dashboards on Screen

**Complete guide showing what changes were made to display user query responses in the UI**

---

## 📊 Overview

This document explains **EXACTLY** what we changed in the project to display results, dashboards, charts, and tables on screen when users ask questions.

**Key Pattern:** Frontend registers actions → Backend agent calls them → UI updates instantly

---

## 🔑 Key Changes Made

### 1. Frontend Actions Registration (`useCopilotAction`)

**Location:** `frontend/app/*/page.tsx`

We added **`useCopilotAction`** hooks that register "callable functions" the backend agent can trigger to update the UI.

#### Example 1: Declarative Dashboard (Complete Dashboard Builder)

**File:** `frontend/app/declarative/page.tsx`

```tsx
export default function DeclarativePage() {
  // State to hold dashboard data
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);

  // Register action that backend can call
  useCopilotAction({
    name: "buildDashboard",
    description: "Build a complete enterprise dashboard with stats, charts, tables",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "stats", type: "object[]", required: true },
      { name: "charts", type: "object[]", required: true },
      { name: "tables", type: "object[]", required: false },
      { name: "callouts", type: "object[]", required: false },
    ],
    handler: async ({ title, stats, charts, tables, callouts }) => {
      // THIS IS THE KEY CHANGE: Update UI state
      setDashboard({
        title,
        stats: stats || [],
        charts: charts || [],
        tables: tables || [],
        callouts: callouts || [],
      });
      return `Dashboard built with ${charts.length} charts.`;
    },
  });

  // Render the dashboard
  return (
    <div>
      {dashboard && (
        <>
          <h1>{dashboard.title}</h1>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {dashboard.stats.map((stat, i) => (
              <KpiCard key={i} stat={stat} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            {dashboard.charts.map((chart, i) => (
              <ChartCard key={i} chart={chart} />
            ))}
          </div>

          {/* Tables */}
          {dashboard.tables?.map((table, i) => (
            <DataTable key={i} table={table} />
          ))}
        </>
      )}
      
      <CopilotPopup />
    </div>
  );
}
```

**What Changed:**
- ✅ Added `useState` to hold dashboard data
- ✅ Registered `buildDashboard` action with `useCopilotAction`
- ✅ Handler updates state with `setDashboard()`
- ✅ UI automatically re-renders when state changes
- ✅ Components (KpiCard, ChartCard, DataTable) render the data

---

#### Example 2: Chart Rendering (Main Dashboard)

**File:** `frontend/app/page.tsx`

```tsx
export default function DashboardPage() {
  const [chartData, setChartData] = useState(null);

  useCopilotAction({
    name: "renderChart",
    description: "Render a bar/pie/line chart with data",
    parameters: [
      { name: "title", type: "string" },
      { name: "data", type: "object[]" },
      { name: "type", type: "string", enum: ["bar", "pie", "line"] },
    ],
    handler: ({ title, data, type }) => {
      // Update chart state
      setChartData({ title, data, type });
      return "Chart displayed.";
    },
  });

  return (
    <div>
      {chartData && (
        <div className="chart-container">
          <h3>{chartData.title}</h3>
          {chartData.type === "bar" && <BarChart data={chartData.data} />}
          {chartData.type === "pie" && <PieChart data={chartData.data} />}
          {chartData.type === "line" && <LineChart data={chartData.data} />}
        </div>
      )}
      <CopilotSidebar />
    </div>
  );
}
```

**What Changed:**
- ✅ Added `chartData` state
- ✅ Registered `renderChart` action
- ✅ Handler updates state based on chart type
- ✅ Conditional rendering shows correct chart component

---

#### Example 3: Carrier Comparison (MCP Demo)

**File:** `frontend/app/carrier-comparison/page.tsx`

```tsx
export default function CarrierComparisonPage() {
  const [comparison, setComparison] = useState(null);

  useCopilotAction({
    name: "renderCarrierComparison",
    description: "Display carrier pricing comparison table",
    parameters: [
      { name: "device", type: "string" },
      { name: "carriers", type: "object[]" },
    ],
    handler: ({ device, carriers }) => {
      // Find best price
      const bestPrice = Math.min(...carriers.map(c => c.price_full));
      const enriched = carriers.map(c => ({
        ...c,
        isBestPrice: c.price_full === bestPrice,
      }));
      
      // Update comparison state
      setComparison({ device, carriers: enriched });
      
      // Show toast notification
      toast.success(`${device} comparison ready!`);
      
      return "Comparison displayed.";
    },
  });

  return (
    <div>
      {comparison && (
        <div className="comparison-table">
          <h2>{comparison.device} Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Price</th>
                <th>Monthly</th>
              </tr>
            </thead>
            <tbody>
              {comparison.carriers.map(carrier => (
                <tr key={carrier.name}>
                  <td>{carrier.name}</td>
                  <td>
                    ${carrier.price_full}
                    {carrier.isBestPrice && <span> 🏆</span>}
                  </td>
                  <td>${carrier.price_monthly}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CopilotChat />
    </div>
  );
}
```

**What Changed:**
- ✅ Added `comparison` state for pricing data
- ✅ Registered `renderCarrierComparison` action
- ✅ Handler enriches data (finds best price)
- ✅ Shows toast notification for feedback
- ✅ Table displays with best price indicator

---

### 2. Backend System Prompt Instructions

**Location:** `backend/prompt_instructions.txt`

We added **clear instructions** telling the LLM agent WHEN and HOW to call frontend actions.

```plaintext
## Database Workflow — EXACTLY 2 tool calls per chart request

  STEP 1 — fetch data with ONE data tool:
    - group_by_count(table, column) → count by category
    - top_n(table, column, n) → top/bottom N rows
    - group_by_sum(table, groupCol, valueCol) → sum by group
    
  STEP 2 — pass that data to ONE render tool:
    - renderChart(title, data) → display bar/pie/line chart
    - renderTable(title, data) → display data table
    - buildDashboard(title, stats, charts, tables) → build full dashboard

NEVER call the same data tool twice. 
NEVER call a data tool after you have data — call the render tool next.

## Examples:

User: "Show top 5 accounts by balance as a bar chart"
  Step 1: top_n(table="finance_accounts", column="balance", n=5, order="DESC")
  Step 2: renderChart(title="Top 5 Accounts", data=[...], type="bar")
  Step 3: "Bar chart displayed showing top 5 accounts."

User: "Build a wireless dashboard"
  Step 1: wireless_summary() → get KPIs
  Step 2: group_by_count("wireless_customers", "plan_type") → plan distribution
  Step 3: group_by_sum("wireless_usage", "signup_month", "data_used_gb") → usage trend
  Step 4: buildDashboard(
            title="Wireless Analytics",
            stats=[{label:"Subscribers", value:50}, ...],
            charts=[
              {kind:"pie", title:"Plan Distribution", data:[...]},
              {kind:"bar", title:"Monthly Usage", data:[...]}
            ]
          )
  Step 5: "Dashboard built with 2 charts."
```

**What Changed:**
- ✅ Added step-by-step workflow instructions
- ✅ Listed all available frontend actions
- ✅ Provided concrete examples with tool sequences
- ✅ Clear rules: data tool THEN render tool

---

### 3. Backend Agent Configuration

**Location:** `backend/agent.py`

We configured the agent to have access to tools AND see frontend actions.

```python
def build_agent():
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    backend_tools = [
        # Data fetching tools
        list_tables,
        table_schema,
        group_by_count,
        group_by_sum,
        top_n,
        time_series,
        
        # Domain summaries
        finance_summary,
        hr_summary,
        wireless_summary,
        
        # Frontend actions are automatically exposed by CopilotKit
        # The LLM sees them as callable tools:
        # - renderChart
        # - renderTable
        # - buildDashboard
        # - renderCarrierComparison
        # etc.
    ]
    
    return create_agent(
        model=llm,
        tools=backend_tools,
        system_prompt=get_system_prompt(),  # ← Loads prompt_instructions.txt
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,
        checkpointer=MemorySaver(),
    )
```

**What Changed:**
- ✅ Agent built with backend tools
- ✅ System prompt loaded from file
- ✅ CopilotKitMiddleware automatically exposes frontend actions as tools
- ✅ LLM can now call both backend tools AND frontend actions

---

### 4. UI Components for Rendering

**Location:** `frontend/components/*` and inline in pages

We created **reusable components** to render different types of data.

#### KPI Card Component

```tsx
function KpiCard({ stat }: { stat: StatSpec }) {
  const gradients = [
    "from-indigo-500 to-indigo-700",
    "from-emerald-500 to-emerald-700",
    "from-violet-500 to-violet-700",
  ];
  
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradients[0]} p-5 text-white shadow-lg`}>
      <p className="text-xs font-semibold uppercase">{stat.label}</p>
      <p className="mt-2 text-3xl font-extrabold">{stat.value}</p>
      {stat.delta && (
        <p className="mt-1 text-sm">
          {stat.trend === "up" ? "↑" : "↓"} {stat.delta}
        </p>
      )}
    </div>
  );
}
```

#### Chart Component

```tsx
function ChartCard({ chart }: { chart: ChartSpec }) {
  if (chart.kind === "pie") {
    return (
      <div className="rounded-2xl border bg-white shadow-sm p-5">
        <h4 className="font-semibold mb-3">{chart.title}</h4>
        <GenPieChart data={chart.data} />
      </div>
    );
  }
  
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5">
      <GenChart spec={chart} />
    </div>
  );
}
```

#### Data Table Component

```tsx
function DataTable({ table }: { table: TableSpec }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {table.title && (
        <div className="px-5 py-3 border-b bg-slate-50">
          <h4 className="font-semibold">{table.title}</h4>
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            {table.columns.map(col => (
              <th key={col} className="text-left px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**What Changed:**
- ✅ Created styled components for KPIs, charts, tables
- ✅ Used Tailwind CSS for consistent styling
- ✅ Added gradients, shadows, hover effects
- ✅ Made components responsive and accessible

---

### 5. Chart Libraries Integration

**Location:** `frontend/components/GenChart.tsx` and `frontend/components/PieChart.tsx`

We integrated **Recharts** library for interactive visualizations.

```tsx
// components/GenChart.tsx
import { BarChart, LineChart, AreaChart, ScatterChart, Bar, Line, Area, Scatter, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function GenChart({ spec }: { spec: ChartSpec }) {
  const { kind, title, data } = spec;
  
  if (kind === "bar") {
    return (
      <div>
        <h4>{title}</h4>
        <BarChart width={600} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#4F46E5" />
        </BarChart>
      </div>
    );
  }
  
  if (kind === "line") {
    return (
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#4F46E5" />
      </LineChart>
    );
  }
  
  // ... more chart types
}
```

**What Changed:**
- ✅ Installed `recharts` library
- ✅ Created wrapper components for different chart types
- ✅ Configured interactive tooltips and legends
- ✅ Styled with brand colors

---

## 🔄 Complete User Flow Example

**User Query:** "Build a wireless dashboard"

### Step 1: User Asks Question
```
User types in CopilotPopup: "Build a wireless dashboard"
```

### Step 2: Backend Agent Receives Request
```python
# backend/agent.py - Agent receives message

# LLM sees:
# - System prompt: "Build dashboard = call wireless_summary + group_by_count + buildDashboard"
# - Available tools: [wireless_summary, group_by_count, buildDashboard, ...]
# - User message: "Build a wireless dashboard"
```

### Step 3: Agent Fetches Data
```python
# LLM decides to call tools:

# Call 1: Get summary stats
result1 = wireless_summary()
# Returns: {subscribers: 50, total_gb: 1717, avg_usage: 34.34}

# Call 2: Get plan distribution
result2 = group_by_count(table="wireless_customers", column="plan_type")
# Returns: [{"Basic": 32}, {"Premium": 18}]

# Call 3: Get monthly usage trend
result3 = group_by_sum(table="wireless_usage", column="signup_month", value_col="data_used_gb")
# Returns: [{"Jan": 120}, {"Feb": 145}, {"Mar": 167}, ...]
```

### Step 4: Agent Calls Frontend Action
```python
# LLM decides: Data ready, now call buildDashboard

buildDashboard(
    title="Wireless Analytics Dashboard",
    stats=[
        {"label": "Total Subscribers", "value": 50, "trend": "up", "delta": "+5 this month"},
        {"label": "Total Data (GB)", "value": 1717, "trend": "up", "delta": "+12%"},
        {"label": "Avg Usage (GB)", "value": 34.34, "trend": "flat"},
    ],
    charts=[
        {
            "kind": "pie",
            "title": "Plan Distribution",
            "data": [
                {"name": "Basic", "value": 32},
                {"name": "Premium", "value": 18}
            ]
        },
        {
            "kind": "bar",
            "title": "Monthly Data Usage (GB)",
            "data": [
                {"name": "Jan", "value": 120},
                {"name": "Feb", "value": 145},
                {"name": "Mar", "value": 167},
            ]
        }
    ]
)
```

### Step 5: Frontend Action Handler Executes
```tsx
// frontend/app/declarative/page.tsx

handler: async ({ title, stats, charts }) => {
    // This runs in the browser
    setDashboard({
        title: "Wireless Analytics Dashboard",
        stats: [...],  // 3 KPI cards
        charts: [...], // 2 charts (pie + bar)
    });
    setLastUpdated(new Date().toLocaleTimeString());
    return "Dashboard built with 2 charts.";
}
```

### Step 6: UI Updates Automatically
```tsx
// React re-renders because state changed

return (
    <div>
        {dashboard && (
            <>
                <h1>{dashboard.title}</h1>  {/* "Wireless Analytics Dashboard" */}
                
                {/* Render 3 KPI cards */}
                <div className="grid grid-cols-3 gap-4">
                    <KpiCard stat={{label:"Total Subscribers", value:50, ...}} />
                    <KpiCard stat={{label:"Total Data (GB)", value:1717, ...}} />
                    <KpiCard stat={{label:"Avg Usage (GB)", value:34.34, ...}} />
                </div>
                
                {/* Render 2 charts */}
                <div className="grid grid-cols-2 gap-4">
                    <ChartCard chart={{kind:"pie", title:"Plan Distribution", ...}} />
                    <ChartCard chart={{kind:"bar", title:"Monthly Data Usage", ...}} />
                </div>
            </>
        )}
    </div>
);
```

### Step 7: User Sees Dashboard
```
✅ Screen shows:
- Title: "Wireless Analytics Dashboard"
- 3 colorful KPI cards with gradients
- Pie chart showing plan distribution
- Bar chart showing monthly usage trend
- All styled with Tailwind CSS
```

---

## 📋 Summary of Changes

### Frontend Changes:

| File | Change | Purpose |
|------|--------|---------|
| `app/declarative/page.tsx` | Added `useCopilotAction("buildDashboard")` | Register dashboard builder action |
| `app/page.tsx` | Added `useCopilotAction("renderChart")` | Register chart rendering action |
| `app/carrier-comparison/page.tsx` | Added `useCopilotAction("renderCarrierComparison")` | Register comparison table action |
| All pages | Added `useState` hooks | Store data for rendering (dashboard, chart, table) |
| All pages | Added conditional rendering | Show components only when data exists |
| `components/GenChart.tsx` | Created chart wrapper | Render bar/line/area/scatter charts |
| `components/PieChart.tsx` | Created pie chart | Render pie/donut charts |
| Inline components | Created KpiCard, DataTable, CalloutBanner | Reusable UI components |

### Backend Changes:

| File | Change | Purpose |
|------|--------|---------|
| `backend/prompt_instructions.txt` | Added tool workflow instructions | Tell LLM when to call frontend actions |
| `backend/prompt_instructions.txt` | Added examples | Show LLM correct tool sequences |
| `backend/agent.py` | Configured agent with tools + middleware | Expose frontend actions as callable tools |
| `backend/agent.py` | Added system prompt loading | Load instructions from file |

### Key Patterns:

1. **State Management:** `useState` hooks hold data
2. **Action Registration:** `useCopilotAction` registers callable handlers
3. **Backend Decision:** LLM decides which action to call based on intent
4. **Handler Execution:** Action handler updates state
5. **Automatic Re-render:** React re-renders UI with new data
6. **Component Rendering:** Specialized components display data beautifully

---

## 🎯 Copy-Paste Prompt for Your Project

```markdown
I need to display query results on screen like this POC:
/Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc

**Reference Files:**
- `frontend/app/declarative/page.tsx` - Dashboard builder pattern
- `frontend/app/page.tsx` - Chart rendering pattern
- `backend/prompt_instructions.txt` - Backend instructions for calling actions

**What I need:**
1. Register frontend actions with useCopilotAction
2. Add state management (useState) to hold results
3. Create UI components to render data (charts, tables, KPIs)
4. Update backend system prompt to tell agent when to call actions
5. Show me the complete code

**My use case:**
[Describe what kind of results you want to show - charts, tables, dashboards, etc.]

Generate the code following the patterns in the reference POC.
```

---

## 🚀 Quick Implementation Checklist

- [ ] Install dependencies: `npm install recharts react-hot-toast`
- [ ] Create state: `const [data, setData] = useState(null)`
- [ ] Register action: `useCopilotAction({ name, handler })`
- [ ] Update state in handler: `setData(newData)`
- [ ] Create render components: `<Chart />`, `<Table />`, etc.
- [ ] Add conditional rendering: `{data && <Chart data={data} />}`
- [ ] Update backend system prompt with action usage instructions
- [ ] Test: Ask question → See results appear on screen ✅

---

**Result:** User asks question → Backend agent fetches data → Calls frontend action → UI updates instantly with beautiful charts, tables, and dashboards! 🎉
