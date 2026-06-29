# 🔄 Migrating Existing LangGraph Agents to CopilotKit

**Step-by-Step Guide for Adding CopilotKit UI to Your Existing LangGraph Projects**

If you already have LangGraph agents working in your projects, this guide shows you how to add a professional web UI without changing your core agent logic.

---

## ⚡ Choose Your Path

> **💡 Running agents via `langgraph dev` or `langgraph up`?**  
> Use **[CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md)** instead! It's faster (15 min) and requires zero backend changes. You only build a Next.js frontend that points to your existing LangGraph URL.

**This guide is for:**
- ✅ Python-based LangGraph agents without LangGraph CLI
- ✅ Projects that need FastAPI integration
- ✅ Custom backend architecture requirements
- ✅ Adding CopilotKit middleware to existing agents

**Use CONNECT_LANGGRAPH_CLI.md if:**
- ✅ Already using `langgraph dev` command
- ✅ Want fastest setup (15 minutes)
- ✅ Don't want to modify backend code

---

## 📋 What You Already Have

Typical existing LangGraph setup:

```python
# your_existing_agent.py
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

# Your existing state
class AgentState(TypedDict):
    messages: list[HumanMessage]
    data: dict

# Your existing tools
@tool
def your_existing_tool(param: str):
    # Your logic
    return result

# Your existing graph
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tools_node)
    # ... your graph logic
    return graph.compile()

# Running manually
if __name__ == "__main__":
    graph = build_graph()
    result = graph.invoke({"messages": [HumanMessage(content="Hello")]})
    print(result)
```

---

## 🎯 What You Want

A web UI where users can chat with your agent:

```
┌────────────────────────────────────┐
│  Your Beautiful Web App            │
│  ┌──────────────────────────────┐  │
│  │ User: "Process my data"      │  │
│  │ Agent: "Processing... ✅"    │  │
│  │ [Results displayed here]     │  │
│  └──────────────────────────────┘  │
│       Powered by CopilotKit        │
└────────────────────────────────────┘
```

---

## ⚡ Quick Migration (30 Minutes)

### Step 1: Install CopilotKit Packages

**Backend:**
```bash
pip install copilotkit==0.1.89 ag-ui-langgraph==0.0.35 fastapi uvicorn
```

**Frontend:**
```bash
npx create-next-app@latest my-app
cd my-app
npm install @copilotkit/react-core @copilotkit/react-ui
```

---

### Step 2: Wrap Your Existing Agent

Create `backend/copilot_wrapper.py`:

```python
# copilot_wrapper.py - NEW FILE
from copilotkit import CopilotKitMiddleware, CopilotKitState
from langgraph.checkpoint.memory import MemorySaver

# Import your existing agent builder
from your_existing_agent import build_graph

def wrap_for_copilotkit():
    """Wrap your existing LangGraph agent for CopilotKit."""
    
    # Get your existing compiled graph
    original_graph = build_graph()
    
    # 🎯 KEY: Add CopilotKit middleware
    # This makes your agent work with the web UI
    return create_agent(
        model=your_llm,  # Your existing LLM
        tools=your_existing_tools,  # Your existing tools list
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,  # Use CopilotKit's state
        system_prompt=your_system_prompt,  # Your existing prompt
        checkpointer=MemorySaver(),
    )
```

**IMPORTANT:** If you have a custom `StateGraph`, you need to adapt it:

#### Option A: Keep Your Existing Graph (Advanced)

```python
from langchain.agents import create_agent

# Replace your StateGraph with create_agent
def migrate_to_copilotkit():
    # Extract your nodes as tools
    tools = [
        your_tool_1,
        your_tool_2,
        # ... all your @tool functions
    ]
    
    return create_agent(
        model=your_llm,
        tools=tools,
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,
        system_prompt=your_system_prompt,
        checkpointer=MemorySaver(),
    )
```

#### Option B: Keep StateGraph (Requires More Work)

If you must keep your custom `StateGraph`, you need to:
1. Add CopilotKit's state fields to your state
2. Handle CopilotKit events manually
3. This is complex - recommend Option A instead

---

### Step 3: Create FastAPI Server

Create `backend/main.py`:

```python
# main.py - NEW FILE
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

# Import your wrapped agent
from copilot_wrapper import wrap_for_copilotkit

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap your agent
compiled_graph = wrap_for_copilotkit()

copilot_agent = LangGraphAGUIAgent(
    name="your-agent",
    graph=compiled_graph,
    description="Your existing agent, now with a web UI!",
    config={"recursion_limit": 20},
)

# Register endpoints
add_langgraph_fastapi_endpoint(
    app,
    copilot_agent,
    path="/api/copilotkit/agents/your-agent",
)

sdk = CopilotKitRemoteEndpoint(agents=[copilot_agent])
add_fastapi_endpoint(app, sdk, "/api/copilotkit")

@app.get("/health")
def health():
    return {"status": "ok"}

# Run: uvicorn main:app --reload --port 8000
```

Start the server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

---

### Step 4: Create Simple Frontend

Create `frontend/app/layout.tsx`:

```tsx
// app/layout.tsx
"use client";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="your-agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

Create `frontend/app/api/copilotkit/route.ts`:

```typescript
// app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  LangGraphAgent,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const agent = new LangGraphAgent({
  name: "your-agent",
  url: "http://localhost:8000/api/copilotkit/agents/your-agent",
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

Create `frontend/app/page.tsx`:

```tsx
// app/page.tsx
"use client";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Page() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Your App with AI Chat</h1>
      <p>Your existing agent is now accessible via the chat sidebar →</p>
      
      <CopilotSidebar
        defaultOpen
        instructions="You are a helpful AI assistant."
        labels={{
          title: "Your Agent",
          initial: "👋 Ask me anything!",
        }}
      />
    </div>
  );
}
```

Start frontend:
```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

**🎉 Done! Your LangGraph agent now has a web UI!**

---

## 🔧 Common Migration Scenarios

### Scenario 1: You Have Multiple Agents

**Before (Existing):**
```python
# You have multiple agents
agent_1 = build_sales_agent()
agent_2 = build_support_agent()
```

**After (CopilotKit):**
```python
# main.py
sales_graph = wrap_sales_agent()
support_graph = wrap_support_agent()

sales_copilot = LangGraphAGUIAgent(name="sales-agent", graph=sales_graph, ...)
support_copilot = LangGraphAGUIAgent(name="support-agent", graph=support_graph, ...)

for agent in [sales_copilot, support_copilot]:
    add_langgraph_fastapi_endpoint(app, agent, f"/api/copilotkit/agents/{agent.name}")

sdk = CopilotKitRemoteEndpoint(agents=[sales_copilot, support_copilot])
```

**Frontend - Switch agents:**
```tsx
const [currentAgent, setCurrentAgent] = useState("sales-agent");

<CopilotKit agent={currentAgent}>
  <button onClick={() => setCurrentAgent("sales-agent")}>Sales</button>
  <button onClick={() => setCurrentAgent("support-agent")}>Support</button>
  <CopilotSidebar />
</CopilotKit>
```

---

### Scenario 2: You Use Custom Tools

**Your existing tools work as-is!**

```python
# Your existing tools
@tool
def query_database(query: str) -> list:
    # Your existing DB logic
    return results

@tool
def process_file(filename: str) -> dict:
    # Your existing file processing
    return data

# Just pass them to create_agent
return create_agent(
    model=llm,
    tools=[query_database, process_file],  # ← Your existing tools
    middleware=[CopilotKitMiddleware(expose_state=True)],
    ...
)
```

**No changes needed to your tool implementations!**

---

### Scenario 3: You Have Custom State

**Before (Existing):**
```python
class MyCustomState(TypedDict):
    messages: list
    user_id: str
    session_data: dict
    custom_field: str
```

**After (CopilotKit):**

You need to extend `CopilotKitState`:

```python
from copilotkit import CopilotKitState
from typing import TypedDict

class MyExtendedState(CopilotKitState):
    """Extend CopilotKit's state with your custom fields."""
    user_id: str
    session_data: dict
    custom_field: str

# Use your extended state
return create_agent(
    model=llm,
    tools=tools,
    middleware=[CopilotKitMiddleware(expose_state=True)],
    state_schema=MyExtendedState,  # ← Your custom state
    ...
)
```

---

### Scenario 4: You Use RAG / Vector Search

**Your existing RAG tools work!**

```python
# Your existing RAG tool
from tools.rag import search_documents  # Your existing RAG

@tool
def search_knowledge_base(query: str) -> list:
    """Search your existing vector database."""
    # Your existing Pinecone/Weaviate/ChromaDB logic
    results = your_vector_db.search(query)
    return results

# Add to agent
return create_agent(
    model=llm,
    tools=[search_knowledge_base, ...],  # ← Works as-is
    ...
)
```

---

### Scenario 5: You Need Authentication

**Add auth to FastAPI:**

```python
# main.py
from fastapi import Depends, HTTPException, Header

def verify_token(authorization: str = Header(...)):
    """Verify JWT token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid token")
    token = authorization[7:]
    # Your token verification logic
    return verify_jwt(token)

# Protect endpoints
@app.post("/api/copilotkit")
def copilotkit_endpoint(user=Depends(verify_token)):
    # Only authenticated users can access
    ...
```

**Frontend - Send token:**
```tsx
<CopilotKit
  runtimeUrl="/api/copilotkit"
  headers={{
    Authorization: `Bearer ${your_jwt_token}`
  }}
>
  {children}
</CopilotKit>
```

---

## 🎨 Adding UI Features to Your Migrated Agent

### Display Results in UI

**Backend - Tell agent to call frontend:**

Update your system prompt:
```python
system_prompt = """You are a helpful assistant.

AVAILABLE FRONTEND ACTIONS:
- displayResults(data, title): Show data in the UI

When user asks for data:
1. Fetch data using your tools
2. Call displayResults(data, title) to show it
3. Summarize in your response
"""
```

**Frontend - Register action:**
```tsx
// app/page.tsx
const [results, setResults] = useState(null);

useCopilotAction({
  name: "displayResults",
  description: "Display results in the UI",
  parameters: [
    { name: "data", type: "object[]", required: true },
    { name: "title", type: "string", required: true },
  ],
  handler: async ({ data, title }) => {
    setResults({ data, title });
    return "Results displayed";
  },
});

// Render results
{results && (
  <div className="bg-white p-6 rounded shadow">
    <h2 className="font-bold mb-4">{results.title}</h2>
    <pre>{JSON.stringify(results.data, null, 2)}</pre>
  </div>
)}
```

---

## 📊 Migration Checklist

- [ ] Install CopilotKit packages (backend + frontend)
- [ ] Create `copilot_wrapper.py` with `create_agent()`
- [ ] Create `main.py` FastAPI server
- [ ] Create Next.js app with CopilotKit provider
- [ ] Create `/api/copilotkit/route.ts`
- [ ] Create page with `CopilotSidebar` or `CopilotChat`
- [ ] Test basic chat functionality
- [ ] Add frontend actions for displaying data
- [ ] Update system prompt to mention frontend actions
- [ ] Test end-to-end workflow
- [ ] Add authentication (if needed)
- [ ] Deploy backend (Railway, Render, Fly.io)
- [ ] Deploy frontend (Vercel)
- [ ] Update URLs for production

---

## 🚨 Common Issues

### Issue: "My custom StateGraph doesn't work"
**Solution:** Use `create_agent()` instead. Extract your graph nodes as separate tools.

### Issue: "Tools not being called"
**Solution:** 
1. Check tool docstrings are clear
2. Test tools independently: `your_tool("test")`
3. Check backend logs for errors
4. Make sure tools are in the `tools` list

### Issue: "Frontend action not triggered"
**Solution:**
1. Mention the action in system prompt
2. Use clear action names (e.g., `displayData`, not `display_data`)
3. Check browser console for errors

### Issue: "State not persisting"
**Solution:** Use checkpointer:
```python
from langgraph.checkpoint.memory import MemorySaver
checkpointer=MemorySaver()
```

---

## 📖 Examples from This POC

### Example 1: Database Agent

**File:** `backend/agent.py` lines 218-255

Shows how to wrap SQLite tools for CopilotKit.

### Example 2: Multi-Agent Setup

**File:** `backend/main.py` lines 37-91

Shows how to register multiple specialized agents.

### Example 3: Frontend Actions

**File:** `frontend/app/carrier-comparison/page.tsx` lines 107-175

Shows advanced frontend actions with UI updates.

---

## 🎯 Next Steps After Migration

1. **Test Your Workflow:**
   - Test all your existing tools still work
   - Verify agent responses are correct
   - Check error handling

2. **Enhance UI:**
   - Add toast notifications
   - Add loading states
   - Add data visualizations
   - Style with your branding

3. **Add Features:**
   - File uploads
   - Multi-agent routing
   - Voice input (STT/TTS)
   - Real-time data updates

4. **Production:**
   - Add authentication
   - Add rate limiting
   - Add monitoring/logging
   - Deploy to cloud

---

## 💡 Pro Tips

1. **Keep Your Logic:** Don't rewrite your existing agent logic. Just wrap it for CopilotKit.

2. **Minimal Changes:** The goal is to add UI with minimal code changes.

3. **Test Incrementally:** Migrate one agent at a time.

4. **Use Examples:** Reference this POC's code as examples.

5. **Read Logs:** Backend logs show what the agent is doing.

---

## 📚 Resources

- **Full Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **Architecture Diagram:** `ARCHITECTURE.md`
- **CopilotKit Docs:** https://docs.copilotkit.ai
- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/

---

**Ready to migrate?** Follow this guide step-by-step. Your existing LangGraph agents can have a professional web UI in under an hour! 🚀
