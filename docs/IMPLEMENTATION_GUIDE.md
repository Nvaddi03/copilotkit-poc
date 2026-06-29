# 🚀 CopilotKit + LangGraph Implementation Guide

**For Replicating This Architecture in Other Projects**

This guide explains how to implement a production-ready CopilotKit + LangGraph system from scratch, using real data instead of dummy data. Perfect for migrating existing LangGraph agents to a full-stack AI application.

---

## ⚡ Quick Navigation

> **💡 Already have LangGraph agents running via `langgraph dev`?**  
> Skip to **[CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md)** for a 15-minute setup that doesn't require FastAPI or backend modifications. You only need to build a simple Next.js frontend!

**This guide is for:**
- ✅ Building a CopilotKit system from scratch
- ✅ Full control over backend architecture
- ✅ Custom FastAPI server with multiple agents
- ✅ Advanced features like MCP servers, RAG, multi-agent routing

**Use CONNECT_LANGGRAPH_CLI.md if:**
- ✅ Your agents already run via `langgraph dev`
- ✅ You just want to add a UI quickly
- ✅ You don't need FastAPI customization

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Connecting Backend + Frontend](#connecting-backend--frontend)
7. [Adding Custom Features](#adding-custom-features)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Components with CopilotKit Hooks               │  │
│  │  - useCopilotAction (register frontend actions)       │  │
│  │  - useCopilotReadable (share context with agent)      │  │
│  │  - CopilotChat / CopilotSidebar / CopilotPopup        │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ HTTP/WebSocket                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            TRANSPORT LAYER (CopilotKit Runtime)             │
│                  /api/copilotkit endpoint                    │
│              Handles streaming, state sync, etc.             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + LangGraph)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  agent.py - Agent Definitions                          │  │
│  │  - @tool decorators (backend tools)                    │  │
│  │  - build_agent() functions                             │  │
│  │  - LangGraph agent compilation                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  main.py - FastAPI Server                              │  │
│  │  - LangGraphAGUIAgent wrappers                         │  │
│  │  - Endpoint registration                               │  │
│  │  - CORS middleware                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ Your Data                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              YOUR DATA SOURCES                               │
│  Database | APIs | File System | Web Scraping | MCP Servers │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

### Required Packages

**Backend:**
```bash
pip install \
  copilotkit==0.1.89 \
  ag-ui-langgraph==0.0.35 \
  langchain-openai \
  langgraph \
  fastapi \
  uvicorn \
  python-dotenv \
  # Add your data source libraries (e.g., psycopg2, sqlalchemy, etc.)
```

**Frontend:**
```bash
npm install \
  @copilotkit/react-core@0.1.89 \
  @copilotkit/react-ui@0.1.89 \
  next@14 \
  react@18 \
  react-dom@18
```

### Environment Variables

Create `.env` file:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for production
```

---

## 📁 Project Structure

```
your-project/
├── backend/
│   ├── agent.py              # Agent definitions + tools
│   ├── main.py               # FastAPI server
│   ├── prompt_instructions.txt  # System prompt
│   └── tools/
│       ├── __init__.py
│       ├── your_data_tools.py   # YOUR custom tools
│       └── ...
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # CopilotKit provider setup
│   │   ├── page.tsx          # Your main page
│   │   └── api/
│   │       └── copilotkit/
│   │           └── route.ts  # Next.js route handler
│   └── package.json
├── .env
└── docs/
    └── IMPLEMENTATION_GUIDE.md  # This file
```

---

## 🔧 Backend Implementation

### Step 1: Create Your Tools (`backend/tools/your_data_tools.py`)

Replace dummy data with **real data sources**:

```python
# tools/your_data_tools.py
import requests
from typing import Dict, List, Any

# Example: Real database query
def get_data_from_db(query: str) -> List[Dict[str, Any]]:
    """Query your PostgreSQL/MySQL/MongoDB database."""
    # Replace with your actual database connection
    import psycopg2
    conn = psycopg2.connect(
        host="your-db-host",
        database="your-db",
        user="your-user",
        password="your-password"
    )
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results

# Example: Real API call
def get_data_from_api(endpoint: str) -> Dict[str, Any]:
    """Fetch data from your REST API."""
    response = requests.get(f"https://your-api.com/{endpoint}")
    return response.json()

# Example: Real file system access
def read_config_file(filename: str) -> Dict[str, Any]:
    """Read configuration from file."""
    import json
    with open(f"/path/to/config/{filename}", "r") as f:
        return json.load(f)
```

### Step 2: Define Agent Tools (`backend/agent.py`)

Wrap your real data functions as LangChain tools:

```python
# backend/agent.py
import os
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from copilotkit import CopilotKitMiddleware, CopilotKitState
from langgraph.checkpoint.memory import MemorySaver

# Import your real data tools
from tools.your_data_tools import (
    get_data_from_db,
    get_data_from_api,
    read_config_file
)

# ✅ IMPORTANT: Wrap tools with error handling
def _safe(fn, *args, **kwargs):
    """Never let tool errors crash the entire agent."""
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}

# Define LangChain tools
@tool
def query_database(sql: str) -> List[Dict[str, Any]]:
    """Execute SQL query against your production database.
    
    Args:
        sql: SELECT query to run (READ-ONLY)
    
    Returns:
        List of rows as dictionaries
    """
    return _safe(get_data_from_db, sql)

@tool
def fetch_api_data(endpoint: str) -> Dict[str, Any]:
    """Fetch data from your REST API.
    
    Args:
        endpoint: API endpoint path (e.g., 'users', 'orders/123')
    
    Returns:
        JSON response from API
    """
    return _safe(get_data_from_api, endpoint)

@tool
def get_config(filename: str) -> Dict[str, Any]:
    """Read configuration file.
    
    Args:
        filename: Config file name (e.g., 'settings.json')
    
    Returns:
        Configuration dictionary
    """
    return _safe(read_config_file, filename)

# Build your agent
def build_agent():
    """Build LangGraph agent with your custom tools."""
    model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    llm = ChatOpenAI(model=model_name, temperature=0)
    
    # List all your backend tools
    backend_tools = [
        query_database,
        fetch_api_data,
        get_config,
        # Add more tools as needed
    ]
    
    system_prompt = """You are an AI assistant with access to production data.

AVAILABLE TOOLS:
- query_database(sql): Execute SQL queries
- fetch_api_data(endpoint): Call REST APIs
- get_config(filename): Read config files

RULES:
1. ALWAYS call tools to fetch real data - NEVER invent data
2. For SQL queries, use READ-ONLY SELECT statements
3. If a tool returns an error, explain it to the user and suggest fixes
4. Be concise and helpful

When the user asks a question:
1. Identify which tool(s) to call
2. Call the tool(s) with correct parameters
3. Analyze the results
4. Present findings clearly to the user
"""
    
    return create_agent(
        model=llm,
        tools=backend_tools,
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,
        system_prompt=system_prompt,
        checkpointer=MemorySaver(),
    )
```

### Step 3: Create FastAPI Server (`backend/main.py`)

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

# Import your agent builder
from agent import build_agent

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build your LangGraph agent
compiled_graph = build_agent()

# Wrap as CopilotKit AG-UI agent
copilot_agent = LangGraphAGUIAgent(
    name="your-agent-name",
    graph=compiled_graph,
    description="Your AI assistant with access to production data.",
    config={"recursion_limit": 20},
)

# Register endpoint
add_langgraph_fastapi_endpoint(
    app,
    copilot_agent,
    path="/api/copilotkit/agents/your-agent-name",
)

# Register CopilotKit SDK endpoint
sdk = CopilotKitRemoteEndpoint(agents=[copilot_agent])
add_fastapi_endpoint(app, sdk, "/api/copilotkit")

@app.get("/health")
def health():
    return {"status": "ok"}

# Run: uvicorn main:app --reload --port 8000
```

### Step 4: Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Test: http://localhost:8000/health

---

## 🎨 Frontend Implementation

### Step 1: Setup CopilotKit Provider (`frontend/app/layout.tsx`)

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
          agent="your-agent-name"  // Must match main.py agent name
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

### Step 2: Create Next.js Route Handler (`frontend/app/api/copilotkit/route.ts`)

```typescript
// app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  LangGraphAgent,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const agent = new LangGraphAgent({
  name: "your-agent-name",
  url: "http://localhost:8000/api/copilotkit/agents/your-agent-name",
});

const runtime = new CopilotRuntime({
  agents: [agent],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### Step 3: Create Your Page (`frontend/app/page.tsx`)

```tsx
// app/page.tsx
"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [activeQuery, setActiveQuery] = useState<string>("");

  // Share context with backend agent
  useCopilotReadable({
    description: "Current active query the user is working on",
    value: activeQuery,
  });

  // Register frontend action that backend can call
  useCopilotAction({
    name: "displayData",
    description: "Display data results in the UI",
    parameters: [
      {
        name: "results",
        type: "object[]",
        required: true,
        description: "Array of data objects to display",
      },
      {
        name: "query",
        type: "string",
        required: true,
        description: "The query that was executed",
      },
    ],
    handler: async ({ results, query }) => {
      setData(results);
      setActiveQuery(query);
      return "Data displayed successfully";
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Your AI-Powered App</h1>
        
        {/* Display data */}
        {data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-2">Query: {activeQuery}</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* CopilotKit Chat UI */}
      <CopilotSidebar
        defaultOpen
        instructions="You are a helpful AI assistant. Use the tools to fetch real data and call displayData to show results to the user."
        labels={{
          title: "Your AI Assistant",
          initial: "👋 Ask me anything about your data!",
        }}
      />
    </div>
  );
}
```

### Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

---

## 🔗 Connecting Backend + Frontend

### Backend: Call Frontend Actions

In your backend agent, tell the LLM to call frontend actions:

```python
# backend/agent.py - Updated system prompt
system_prompt = """You are an AI assistant with access to production data.

AVAILABLE TOOLS:
- query_database(sql): Execute SQL queries
- fetch_api_data(endpoint): Call REST APIs

AVAILABLE FRONTEND ACTIONS:
- displayData(results, query): Show data in the UI

WORKFLOW:
1. User asks a question
2. Call backend tools to fetch data
3. Call displayData to show results in the UI
4. Summarize findings in your response

Example:
User: "Show me the top 10 customers"
You: 
  1. query_database("SELECT * FROM customers ORDER BY revenue DESC LIMIT 10")
  2. displayData(results=[...], query="Top 10 customers")
  3. "I've displayed the top 10 customers ranked by revenue."
"""
```

### Frontend: Call Backend Tools

The backend automatically sees all registered `useCopilotAction` handlers. Just describe them clearly in your system prompt.

---

## 🎯 Adding Custom Features

### Feature 1: Toast Notifications

**Frontend:**
```bash
npm install react-hot-toast
```

```tsx
// app/page.tsx
import { toast, Toaster } from "react-hot-toast";

useCopilotAction({
  name: "showNotification",
  description: "Show a toast notification to the user",
  parameters: [
    { name: "message", type: "string", required: true },
    { name: "type", type: "string", required: false }, // 'success' | 'error' | 'info'
  ],
  handler: async ({ message, type }) => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
    return "Notification shown";
  },
});

// Add Toaster component
<Toaster position="top-right" />
```

### Feature 2: Loading States

**Frontend:**
```tsx
const [isLoading, setIsLoading] = useState(false);

useCopilotAction({
  name: "setLoadingState",
  description: "Show/hide loading indicator",
  parameters: [{ name: "loading", type: "boolean", required: true }],
  handler: async ({ loading }) => {
    setIsLoading(loading);
    return "Loading state updated";
  },
});

{isLoading && <div className="spinner">Loading...</div>}
```

### Feature 3: Multiple Agents (Multi-Agent Routing)

**Backend:**
```python
# agent.py
def build_specialized_agent(domain: str, tools: list, prompt: str):
    llm = ChatOpenAI(model="gpt-4o-mini")
    return create_agent(
        model=llm,
        tools=tools,
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,
        system_prompt=prompt,
        checkpointer=MemorySaver(),
    )

def build_sales_agent():
    return build_specialized_agent(
        "Sales",
        [query_database, fetch_api_data],
        "You are a sales specialist. Focus on customer and revenue data."
    )

def build_support_agent():
    return build_specialized_agent(
        "Support",
        [query_database, fetch_api_data],
        "You are a support specialist. Focus on tickets and customer issues."
    )
```

**Main.py:**
```python
sales_agent = LangGraphAGUIAgent(name="sales-agent", graph=build_sales_agent(), ...)
support_agent = LangGraphAGUIAgent(name="support-agent", graph=build_support_agent(), ...)

for agent in [sales_agent, support_agent]:
    add_langgraph_fastapi_endpoint(app, agent, f"/api/copilotkit/agents/{agent.name}")

sdk = CopilotKitRemoteEndpoint(agents=[sales_agent, support_agent])
```

**Frontend:**
```tsx
// Switch agents dynamically
<CopilotKit agent="sales-agent">  {/* or "support-agent" */}
  {children}
</CopilotKit>
```

---

## 🚀 Production Deployment

### Backend Deployment (FastAPI)

**Option 1: Docker**
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Option 2: Railway / Render / Fly.io**
- Push to GitHub
- Connect repo to hosting platform
- Set environment variables (`OPENAI_API_KEY`)
- Deploy automatically

### Frontend Deployment (Next.js)

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel deploy
```

Update `route.ts` with production backend URL:
```typescript
const agent = new LangGraphAgent({
  name: "your-agent-name",
  url: "https://your-backend.railway.app/api/copilotkit/agents/your-agent-name",
});
```

---

## 🐛 Troubleshooting

### Issue: "Agent not found"
**Solution:** Ensure agent name matches across:
- `backend/main.py`: `LangGraphAGUIAgent(name="your-agent")`
- `frontend/app/layout.tsx`: `<CopilotKit agent="your-agent">`
- `frontend/app/api/copilotkit/route.ts`: `new LangGraphAgent({name: "your-agent"})`

### Issue: CORS errors
**Solution:** Add your frontend URL to CORS:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-app.vercel.app"],
    ...
)
```

### Issue: Tools not being called
**Solution:**
1. Check system prompt describes tools clearly
2. Add detailed tool docstrings
3. Test tool independently: `query_database("SELECT 1")`
4. Check backend logs for errors

### Issue: Frontend action not triggered
**Solution:**
1. Ensure `useCopilotAction` is defined before chat component
2. Check action `name` matches what agent calls
3. Update system prompt to mention the action
4. Add `console.log` in handler to debug

---

## 📚 Next Steps

### For Your Real Project:

1. **Replace Data Sources:**
   - Delete dummy data tools
   - Add your database connections
   - Create tools for your APIs
   - Add file system access if needed

2. **Customize UI:**
   - Replace generic components with your branding
   - Add domain-specific visualizations
   - Implement custom workflows

3. **Security:**
   - Add authentication (JWT, OAuth)
   - Implement rate limiting
   - Validate tool inputs
   - Sanitize SQL queries

4. **Monitoring:**
   - Add logging (e.g., `logging` library)
   - Track agent performance
   - Monitor API usage
   - Set up error alerts

5. **Testing:**
   - Unit test tools independently
   - Integration test agent workflows
   - E2E test frontend actions
   - Load test production deployment

---

## 📖 Additional Resources

- **CopilotKit Docs:** https://docs.copilotkit.ai
- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/
- **This POC Codebase:** Reference `backend/agent.py` and `frontend/app/*/page.tsx`

---

## 🎓 Quick Reference: Key Concepts

| Concept | Definition | Example |
|---------|-----------|---------|
| **@tool** | Backend function LLM can call | `@tool def query_db(sql: str): ...` |
| **useCopilotAction** | Frontend function backend can call | `useCopilotAction({name: "displayData", handler: ...})` |
| **useCopilotReadable** | Share frontend state with backend | `useCopilotReadable({value: currentUser})` |
| **LangGraphAGUIAgent** | Wrapper for LangGraph in CopilotKit | `LangGraphAGUIAgent(name="agent", graph=...)` |
| **System Prompt** | Instructions for LLM behavior | "You are an AI assistant. Use tools to fetch data..." |
| **CopilotKitMiddleware** | Connects LangGraph to CopilotKit | `middleware=[CopilotKitMiddleware(expose_state=True)]` |

---

**Need help?** Review the existing POC code in:
- `backend/agent.py` - Full agent implementation
- `backend/main.py` - FastAPI server setup
- `frontend/app/carrier-comparison/page.tsx` - Advanced frontend example with 12 UI features

**Ready to implement?** Follow this guide step-by-step, replacing dummy data with your real data sources. The architecture is proven and production-ready! 🚀
