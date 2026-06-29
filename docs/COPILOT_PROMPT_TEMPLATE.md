# 🤖 Copilot Prompt Template

**Use this prompt to ask GitHub Copilot to implement CopilotKit UI for your existing LangGraph agents**

---

## 📋 Template 1: Simple Setup (Copy & Fill)

```markdown
I have [NUMBER] LangGraph agents already running via `langgraph dev`. I need to add a CopilotKit UI to interact with them.

**My Setup:**
- Agent 1 URL: [YOUR_AGENT_1_URL]
- Agent 1 Name: [YOUR_AGENT_1_NAME]
- Agent 1 Purpose: [WHAT_AGENT_1_DOES]

- Agent 2 URL: [YOUR_AGENT_2_URL]
- Agent 2 Name: [YOUR_AGENT_2_NAME]
- Agent 2 Purpose: [WHAT_AGENT_2_DOES]

**What I need:**
1. Create a Next.js 14 frontend with TypeScript and Tailwind CSS
2. Install and configure CopilotKit to connect to my agents
3. Add a chat sidebar interface to interact with the agents
4. Add frontend actions that my agents can call to:
   - Display data in tables
   - Show charts (bar, pie, line)
   - Display toast notifications
   - Show KPI cards

**Reference Implementation:**
- Follow: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CONNECT_LANGGRAPH_CLI.md
- Architecture: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/ARCHITECTURE.md
- Code examples: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CHEAT_SHEET.md

**Project Structure:**
Create a new Next.js app with this structure:
```
my-copilot-app/
├── app/
│   ├── layout.tsx              ← CopilotKit Provider
│   ├── page.tsx                ← Chat UI + Frontend Actions
│   └── api/
│       └── copilotkit/
│           └── route.ts        ← Connect to my LangGraph agents
├── components/
│   ├── Chart.tsx              ← Chart component
│   └── DataTable.tsx          ← Table component
├── package.json
└── .env.local
```

**Step-by-step:**
1. Create the Next.js 14 app: `npx create-next-app@latest my-copilot-app --typescript --tailwind --app`
2. Install CopilotKit packages
3. Create the 3 core files (layout.tsx, page.tsx, route.ts) with my agent URLs
4. Add example frontend actions with proper TypeScript types
5. Style with Tailwind CSS

Start by creating the project and the 3 core files.
```

---

## 📋 Template 2: Detailed Setup (More Features)

```markdown
I have LangGraph agents running and want to add a professional UI with CopilotKit.

**Agent Configuration:**

Agent 1: [NAME]
- URL: [URL]
- Port: [PORT]
- What it does: [DESCRIPTION]
- Tools it has: [LIST_TOOLS]
- Example query: "[EXAMPLE]"

Agent 2: [NAME]
- URL: [URL]
- Port: [PORT]
- What it does: [DESCRIPTION]
- Tools it has: [LIST_TOOLS]
- Example query: "[EXAMPLE]"

**UI Requirements:**

Layout:
- [ ] Chat sidebar on the right side
- [ ] Main content area for data display
- [ ] Header with title and agent selector
- [ ] Toast notifications for feedback

Frontend Actions (agents can trigger these):
1. **displayData(results: any[], title: string)**
   - Show query results in a sortable table
   - Auto-generate columns from object keys
   - Add search/filter functionality

2. **showChart(data: ChartData[], type: 'bar' | 'pie' | 'line')**
   - Display interactive charts using recharts
   - Support multiple chart types
   - Add tooltips and legends

3. **showMetrics(metrics: Metric[])**
   - Display KPI cards in a grid
   - Show trend indicators (up/down arrows)
   - Color-coded by performance

4. **showNotification(message: string, type: 'success' | 'error' | 'info')**
   - Toast notifications in top-right
   - Auto-dismiss after 3 seconds
   - Different colors per type

**Styling:**
- Use Tailwind CSS with [YOUR_COLOR_SCHEME] theme
- Add smooth transitions and hover effects
- Responsive design (mobile-friendly)
- Professional gradient backgrounds for cards

**Reference Files:**
- Connection guide: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CONNECT_LANGGRAPH_CLI.md
- Code patterns: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CHEAT_SHEET.md
- UI examples: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/frontend/app/carrier-comparison/page.tsx

**Implementation Steps:**
1. Scaffold Next.js 14 project with TypeScript
2. Install: @copilotkit/react-core, @copilotkit/react-ui, @copilotkit/runtime, recharts, react-hot-toast
3. Create app/api/copilotkit/route.ts - Connect to both agents
4. Create app/layout.tsx - CopilotKit provider setup
5. Create app/page.tsx - Main UI with chat + display area + all frontend actions
6. Create components/Chart.tsx - Recharts wrapper
7. Create components/DataTable.tsx - Sortable table component
8. Add Tailwind config with custom theme
9. Test with example queries

Begin with steps 1-5 (core setup), then we'll add charts and tables.
```

---

## 📋 Template 3: Multi-Agent Dashboard

```markdown
I want to create a multi-agent dashboard with CopilotKit for my [PROJECT_NAME] project.

**Agents Setup:**

I have [NUMBER] LangGraph agents running at [BASE_URL]:

1. **[AGENT_1_NAME]** (graph_id: "[GRAPH_ID_1]")
   - Domain: [DOMAIN]
   - Capabilities: [LIST]
   - Example: "[EXAMPLE_QUERY]"

2. **[AGENT_2_NAME]** (graph_id: "[GRAPH_ID_2]")
   - Domain: [DOMAIN]
   - Capabilities: [LIST]
   - Example: "[EXAMPLE_QUERY]"

**Dashboard Requirements:**

Main Features:
1. Agent selector dropdown (switch between agents)
2. Chat interface (sidebar or inline)
3. Data visualization area
4. Real-time updates
5. Export functionality

Visualizations:
- [ ] Data tables with sorting/filtering
- [ ] Bar/Pie/Line charts
- [ ] KPI cards with trends
- [ ] Timeline views
- [ ] Comparison tables

Frontend Actions:
```typescript
// Define these actions that agents can call:
interface Actions {
  renderDashboard(config: DashboardConfig): void;
  displayTable(data: any[], columns: string[]): void;
  showChart(chartConfig: ChartConfig): void;
  updateMetrics(metrics: KPI[]): void;
  showComparison(items: any[]): void;
}
```

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- CopilotKit (@copilotkit/react-core, @copilotkit/react-ui, @copilotkit/runtime)
- Recharts (for charts)
- React Hot Toast (for notifications)

**Reference Implementation:**
Look at: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/

Key files to reference:
- `/docs/CONNECT_LANGGRAPH_CLI.md` - Connection setup
- `/docs/ARCHITECTURE.md` - Architecture patterns
- `/frontend/app/declarative/page.tsx` - Dashboard example
- `/frontend/app/carrier-comparison/page.tsx` - Multi-data display

**Create:**
1. New Next.js app with proper structure
2. Multi-agent runtime configuration
3. Dashboard page with all components
4. Reusable chart/table components
5. Agent switcher UI
6. All frontend actions with TypeScript types

Start by creating the project structure and core configuration files.
```

---

## 📋 Template 4: Quick Minimal Setup

```markdown
Quick setup: Add CopilotKit UI to my LangGraph agents.

**Agents:**
- URL: [YOUR_URL]
- Agent 1: [NAME_1]
- Agent 2: [NAME_2]

**Need:**
- Next.js 14 with CopilotKit
- Chat sidebar
- Display results in tables

**Reference:**
- Guide: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CONNECT_LANGGRAPH_CLI.md
- Examples: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CHEAT_SHEET.md

**Create:**
1. app/api/copilotkit/route.ts (connect to agents)
2. app/layout.tsx (provider)
3. app/page.tsx (chat + table display)

Use TypeScript + Tailwind. Start now.
```

---

## 🎯 How to Use These Templates

### Step 1: Choose Your Template
- **Template 1**: Basic setup with 2 agents
- **Template 2**: Detailed with specific UI features
- **Template 3**: Full dashboard with multiple agents
- **Template 4**: Minimal quick start

### Step 2: Fill in Your Details

Replace these placeholders:

| Placeholder | Example | Your Value |
|------------|---------|------------|
| `[YOUR_AGENT_1_URL]` | http://localhost:2024 | _____________ |
| `[YOUR_AGENT_1_NAME]` | order-agent | _____________ |
| `[WHAT_AGENT_1_DOES]` | Processes customer orders | _____________ |
| `[YOUR_AGENT_2_URL]` | http://localhost:2024 | _____________ |
| `[YOUR_AGENT_2_NAME]` | inventory-agent | _____________ |
| `[WHAT_AGENT_2_DOES]` | Manages inventory data | _____________ |
| `[YOUR_COLOR_SCHEME]` | blue, indigo, purple | _____________ |

### Step 3: Copy & Paste to Copilot

1. Fill in the template
2. Copy the entire prompt
3. Paste into GitHub Copilot chat
4. Follow Copilot's instructions

---

## 🔄 Follow-Up Prompts

After initial setup, use these to add features:

### Add Charts
```markdown
Add chart visualization:
1. Install recharts
2. Create components/Chart.tsx with Bar, Pie, Line chart support
3. Add useCopilotAction for "showChart" 
4. Display in main content area

Reference: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/frontend/components/GenChart.tsx
```

### Add Data Tables
```markdown
Add sortable data tables:
1. Create components/DataTable.tsx
2. Add column sorting and filtering
3. Add useCopilotAction for "displayData"
4. Style with Tailwind

Reference: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/frontend/app/declarative/page.tsx (DataTable component)
```

### Add Toast Notifications
```markdown
Add toast notifications:
1. Install react-hot-toast
2. Add Toaster component
3. Create useCopilotAction for "showNotification"
4. Add to layout.tsx

Reference: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/frontend/app/carrier-comparison/page.tsx (Toast usage)
```

### Update Agent System Prompt
```markdown
Help me update my agent's system prompt to use frontend actions.

My available frontend actions:
- displayData(results, title)
- showChart(data, type)
- showNotification(message, type)

Create a system prompt section that tells the agent:
1. When to call each action
2. Required data format
3. Best practices

Format as Python docstring to add to my agent code.
```

### Add Loading States
```markdown
Add loading indicators:
1. Create loading skeleton components
2. Add loading state management
3. Show spinner during agent processing
4. Add progress bar for long operations

Reference: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/frontend/app/carrier-comparison/page.tsx (Loading states)
```

---

## 📝 Example: Complete Filled Template

```markdown
I have 2 LangGraph agents already running via `langgraph dev`. I need to add a CopilotKit UI to interact with them.

**My Setup:**
- Agent 1 URL: http://localhost:2024
- Agent 1 Name: order-processing-agent
- Agent 1 Purpose: Processes customer orders, calculates totals, checks inventory

- Agent 2 URL: http://localhost:2024
- Agent 2 Name: inventory-management-agent
- Agent 2 Purpose: Queries inventory database, tracks stock levels, generates reports

**What I need:**
1. Create a Next.js 14 frontend with TypeScript and Tailwind CSS
2. Install and configure CopilotKit to connect to my agents
3. Add a chat sidebar interface to interact with the agents
4. Add frontend actions that my agents can call to:
   - Display data in tables
   - Show charts (bar, pie, line)
   - Display toast notifications
   - Show KPI cards

**Reference Implementation:**
- Follow: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CONNECT_LANGGRAPH_CLI.md
- Architecture: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/ARCHITECTURE.md
- Code examples: /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc/docs/CHEAT_SHEET.md

**Project Structure:**
Create a new Next.js app with this structure:
```
order-management-ui/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── copilotkit/
│           └── route.ts
├── components/
│   ├── Chart.tsx
│   └── DataTable.tsx
├── package.json
└── .env.local
```

**Step-by-step:**
1. Create the Next.js 14 app: `npx create-next-app@latest order-management-ui --typescript --tailwind --app`
2. Install CopilotKit packages
3. Create the 3 core files (layout.tsx, page.tsx, route.ts) with my agent URLs
4. Add example frontend actions with proper TypeScript types
5. Style with Tailwind CSS using blue/indigo theme

Start by creating the project and the 3 core files.
```

---

## 💡 Tips for Best Results

1. **Be Specific**: More details = better code
2. **Reference Files**: Always point to the POC documentation
3. **One Step at a Time**: Start with core, add features incrementally
4. **Test After Each Step**: Verify before adding next feature
5. **Use Follow-Ups**: Add features with follow-up prompts

---

## 🎓 What Copilot Will Create

When you use these prompts, Copilot will generate:

### Core Files (15 minutes)
1. **app/api/copilotkit/route.ts** - Runtime configuration
2. **app/layout.tsx** - CopilotKit provider
3. **app/page.tsx** - Chat UI + frontend actions
4. **package.json** - With all dependencies
5. **.env.local** - Environment variables

### Components (if requested)
6. **components/Chart.tsx** - Chart wrapper
7. **components/DataTable.tsx** - Table component
8. **components/KPICard.tsx** - Metrics display

### Utilities
9. **types/index.ts** - TypeScript types
10. **lib/utils.ts** - Helper functions

---

## 🚀 Ready to Start?

1. ✅ Choose your template above
2. ✅ Fill in your agent details
3. ✅ Copy the complete prompt
4. ✅ Paste into GitHub Copilot
5. ✅ Follow the generated instructions

**Your agents + CopilotKit UI = Production-ready app in 30 minutes! 🎉**
