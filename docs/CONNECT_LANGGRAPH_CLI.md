# 🚀 Connect CopilotKit to Existing LangGraph CLI Agents

**For projects where agents are already running via `langgraph dev` or `langgraph up`**

---

## 🎯 Overview

If you already have LangGraph agents running through the LangGraph CLI, you **DON'T need a FastAPI backend**. You can connect CopilotKit directly to your LangGraph deployment URL.

### What You Have
```bash
# Your existing setup
langgraph dev  # Running on http://localhost:2024
# or
langgraph up --port 8000
```

### What You Need
Just a Next.js frontend with CopilotKit configured to point to your LangGraph URL.

---

## 📋 Prerequisites

- ✅ LangGraph agents already built and working
- ✅ LangGraph CLI installed: `pip install langgraph-cli`
- ✅ Agents running via `langgraph dev` or `langgraph up`
- ✅ Next.js project (or create new one)

---

## ⚡ Quick Setup (15 Minutes)

### Step 1: Check Your LangGraph Setup

```bash
# Verify your agent is running
langgraph dev

# Output should show:
# 🚀 LangGraph API server starting...
# 📡 Agent running at http://localhost:2024
# 📝 Available at /runs, /threads, etc.
```

**Note your agent name and URL:**
- URL: `http://localhost:2024` (default for `langgraph dev`)
- Agent name: Check your `langgraph.json` or agent definition

### Step 2: Create Next.js Frontend

```bash
npx create-next-app@latest my-copilot-app --typescript --tailwind --app
cd my-copilot-app
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

### Step 3: Configure CopilotKit Runtime

Create the API route that connects to your LangGraph CLI:

```typescript
// app/api/copilotkit/route.ts
import { 
  CopilotRuntime, 
  LangGraphAgent, 
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// 🔗 Point to your LangGraph CLI URL
const agent = new LangGraphAgent({
  name: "my-agent",  // ← Replace with your agent name
  url: "http://localhost:2024",  // ← Your LangGraph CLI URL
});

const runtime = new CopilotRuntime({ agents: [agent] });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### Step 4: Add CopilotKit Provider

```tsx
// app/layout.tsx
"use client";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit 
          runtimeUrl="/api/copilotkit"
          agent="my-agent"  // ← Must match agent name in route.ts
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

### Step 5: Add Chat UI

```tsx
// app/page.tsx
"use client";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">My LangGraph Agent</h1>
      <p className="text-gray-600 mb-8">
        Chat with your LangGraph agent using CopilotKit UI
      </p>
      
      <CopilotSidebar
        defaultOpen
        instructions="You are a helpful AI assistant powered by LangGraph."
        labels={{
          title: "AI Assistant",
          initial: "👋 Ask me anything! I'm connected to your LangGraph agent."
        }}
      />
    </div>
  );
}
```

### Step 6: Run Everything

```bash
# Terminal 1: Keep your LangGraph agent running
langgraph dev

# Terminal 2: Start Next.js
npm run dev

# Visit http://localhost:3000
```

---

## 🔧 Configuration Options

### Multiple Agents

If you have multiple agents in your LangGraph setup:

```typescript
// app/api/copilotkit/route.ts
const financeAgent = new LangGraphAgent({
  name: "finance-agent",
  url: "http://localhost:2024",
  graphId: "finance",  // ← Specific graph ID
});

const hrAgent = new LangGraphAgent({
  name: "hr-agent",
  url: "http://localhost:2024",
  graphId: "hr",
});

const runtime = new CopilotRuntime({ 
  agents: [financeAgent, hrAgent] 
});
```

### LangGraph Cloud Deployment

If your agent is deployed to LangGraph Cloud:

```typescript
// app/api/copilotkit/route.ts
const agent = new LangGraphAgent({
  name: "my-agent",
  url: "https://your-deployment.langgraph.cloud",  // ← Cloud URL
  headers: {
    "X-Api-Key": process.env.LANGGRAPH_API_KEY,  // ← Add auth
  },
});
```

### Custom Port

If your LangGraph CLI runs on a different port:

```bash
# Start on custom port
langgraph dev --port 8080
```

```typescript
// Update route.ts
const agent = new LangGraphAgent({
  name: "my-agent",
  url: "http://localhost:8080",  // ← Match your port
});
```

---

## 🎨 Adding Frontend Actions

Your LangGraph agent can call frontend actions via `useCopilotAction`:

```tsx
// app/page.tsx
"use client";
import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function HomePage() {
  const [data, setData] = useState(null);

  // Register a frontend action your LangGraph agent can call
  useCopilotAction({
    name: "displayResults",
    description: "Display query results in the UI",
    parameters: [
      { name: "results", type: "object[]", required: true },
      { name: "title", type: "string", required: true },
    ],
    handler: async ({ results, title }) => {
      setData({ results, title });
      return "Results displayed successfully";
    },
  });

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">My LangGraph Agent</h1>
      
      {/* Show results when agent calls displayResults */}
      {data && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">{data.title}</h2>
          <pre className="text-sm">{JSON.stringify(data.results, null, 2)}</pre>
        </div>
      )}
      
      <CopilotSidebar defaultOpen />
    </div>
  );
}
```

**Update your LangGraph agent to use this action:**

```python
# In your LangGraph agent code
from copilotkit.langchain import copilotkit_customize_config

# Your agent should emit this to call the frontend action
# This happens automatically when CopilotKit middleware is configured
```

---

## 📊 Architecture Diagram

```mermaid
graph TB
    User[User Input]
    UI[Next.js Frontend<br/>CopilotKit UI]
    Route[/api/copilotkit Route<br/>CopilotRuntime]
    CLI[LangGraph CLI<br/>langgraph dev]
    Agent[Your LangGraph Agent<br/>With Tools]
    
    User -->|Chat| UI
    UI -->|HTTP POST| Route
    Route -->|WebSocket| CLI
    CLI -->|Execute| Agent
    Agent -->|Response| CLI
    CLI -->|Stream| Route
    Route -->|Update| UI
    UI -->|Display| User
    
    style CLI fill:#FF9800
    style Agent fill:#4CAF50
    style Route fill:#2196F3
```

**Key Difference from FastAPI Setup:**
- ❌ No FastAPI backend needed
- ❌ No `main.py` or `agent.py` modifications
- ✅ Just connect to existing LangGraph CLI URL
- ✅ All agent logic stays in your LangGraph code

---

## 🔍 Finding Your Agent Name

### Method 1: Check langgraph.json

```json
// langgraph.json
{
  "graphs": {
    "my-agent": "./agent.py:graph",  // ← Agent name is "my-agent"
    "finance-agent": "./finance.py:graph"
  }
}
```

### Method 2: Check Agent Definition

```python
# agent.py
from langgraph.graph import StateGraph

graph = StateGraph(...)
graph.name = "my-agent"  # ← This is your agent name
```

### Method 3: Test the API

```bash
# Call the LangGraph API directly
curl http://localhost:2024/info

# Response shows available agents:
{
  "agents": ["my-agent", "finance-agent"]
}
```

---

## 🎯 Common Scenarios

### Scenario 1: Simple Q&A Agent

**Your LangGraph Agent:**
```python
# Already running via langgraph dev
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph

# Your existing agent with tools
graph = StateGraph(...)
# Tools for database queries, APIs, etc.
```

**Frontend:**
```tsx
// Just add CopilotChat - no changes to backend needed
import { CopilotChat } from "@copilotkit/react-ui";

export default function Page() {
  return <CopilotChat instructions="You are a helpful assistant." />;
}
```

### Scenario 2: Data Visualization Agent

**Your LangGraph Agent:**
```python
# Already has tools for database queries
@tool
def query_sales_data(query: str):
    # Returns sales data
    pass
```

**Frontend (Add Visualization):**
```tsx
import { useCopilotAction } from "@copilotkit/react-core";
import { BarChart } from "recharts";

// Register action for agent to call
useCopilotAction({
  name: "showChart",
  parameters: [{ name: "data", type: "object[]" }],
  handler: async ({ data }) => {
    setChartData(data);
    return "Chart displayed";
  },
});

// Show chart
{chartData && <BarChart data={chartData} />}
```

**Update Agent System Prompt:**
```python
# Tell your agent about the new frontend action
system_prompt = """
When user asks for visualization:
1. Query data using query_sales_data
2. Call showChart(data) to display
3. Summarize insights
"""
```

### Scenario 3: Multi-Agent System

**Your LangGraph Setup:**
```bash
langgraph dev  # Runs multiple agents from langgraph.json
```

**Frontend:**
```tsx
// Route.ts - Connect all agents
const agents = [
  new LangGraphAgent({ name: "finance-agent", url: "http://localhost:2024", graphId: "finance" }),
  new LangGraphAgent({ name: "hr-agent", url: "http://localhost:2024", graphId: "hr" }),
  new LangGraphAgent({ name: "sales-agent", url: "http://localhost:2024", graphId: "sales" }),
];

const runtime = new CopilotRuntime({ agents });
```

---

## 🐛 Troubleshooting

### Issue: "Agent not found"

**Check:**
```bash
# Verify agent is running
curl http://localhost:2024/info

# Should show your agent name
```

**Fix:**
- Ensure `agent.name` in route.ts matches LangGraph agent name
- Check `langgraph.json` for correct agent names

### Issue: "Connection refused"

**Check:**
```bash
# Is LangGraph CLI running?
langgraph dev

# Check port
lsof -i :2024
```

**Fix:**
- Start LangGraph CLI: `langgraph dev`
- Update URL in route.ts if using different port

### Issue: "CORS errors"

**Fix (LangGraph CLI):**
```bash
# Start with CORS enabled
langgraph dev --cors-allow-origins=http://localhost:3000
```

**Or update langgraph.json:**
```json
{
  "server": {
    "cors": {
      "allow_origins": ["http://localhost:3000"]
    }
  }
}
```

### Issue: "Frontend actions not working"

**Check Agent System Prompt:**
```python
# Your agent needs to know about frontend actions
system_prompt = """
AVAILABLE FRONTEND ACTIONS:
- displayResults(results, title): Show data in UI
- showChart(data): Display chart

Always call these after fetching data.
"""
```

**Verify Action Registration:**
```tsx
// Must be defined before CopilotSidebar
useCopilotAction({
  name: "displayResults",
  // ...
});

<CopilotSidebar />  // ← After actions
```

---

## 📦 Required Packages

**Frontend Only:**
```json
{
  "dependencies": {
    "@copilotkit/react-core": "^0.1.89",
    "@copilotkit/react-ui": "^0.1.89",
    "@copilotkit/runtime": "^0.1.89",
    "next": "^14.2.0",
    "react": "^18.3.0"
  }
}
```

**Backend (Already Have):**
```bash
# Your existing setup
pip install langgraph langgraph-cli langchain-openai
```

---

## 🚀 Production Deployment

### Deploy LangGraph Agent

```bash
# Option 1: LangGraph Cloud (Recommended)
langgraph deploy

# Option 2: Docker
langgraph build
docker run -p 8080:8080 my-agent:latest
```

### Deploy Next.js Frontend

```bash
# Vercel (Recommended)
vercel deploy

# Update route.ts with production URL
const agent = new LangGraphAgent({
  name: "my-agent",
  url: process.env.LANGGRAPH_URL || "https://your-deployment.langgraph.cloud",
  headers: {
    "X-Api-Key": process.env.LANGGRAPH_API_KEY,
  },
});
```

### Environment Variables

```bash
# .env.local (Next.js)
LANGGRAPH_URL=https://your-deployment.langgraph.cloud
LANGGRAPH_API_KEY=your-api-key
```

---

## 🎓 Next Steps

1. ✅ **You're Done!** Your LangGraph agent now has a UI
2. 🎨 **Add Features:** Toast notifications, loading states, charts
3. 🔐 **Add Auth:** Protect your routes with authentication
4. 📊 **Add Analytics:** Track agent usage and performance
5. 🚀 **Deploy:** Push to production

---

## 📚 Example Project Structure

```
my-copilot-app/
├── app/
│   ├── layout.tsx              ← CopilotKit Provider
│   ├── page.tsx                ← Chat UI + Actions
│   └── api/
│       └── copilotkit/
│           └── route.ts        ← Connect to LangGraph CLI
├── package.json
└── .env.local

# Separate repository (your existing LangGraph project)
my-langgraph-agent/
├── agent.py                    ← Your existing agent
├── langgraph.json             ← LangGraph config
└── requirements.txt
```

---

## 💡 Key Takeaways

| ✅ What You Keep | ❌ What You Don't Need |
|------------------|------------------------|
| Existing LangGraph agent | FastAPI backend |
| LangGraph CLI (`langgraph dev`) | `main.py` file |
| Agent tools and logic | CopilotKit backend code |
| `langgraph.json` config | Backend route registration |

**You only need to build the frontend!** Your LangGraph agent stays exactly as it is.

---

## 🤝 Getting Help

- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/
- **CopilotKit Docs:** https://docs.copilotkit.ai/
- **This POC:** See `docs/ARCHITECTURE.md` for full system design

---

**Ready?** Run `langgraph dev` and start building your frontend! 🎉
