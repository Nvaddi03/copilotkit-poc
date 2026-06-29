# 📝 CopilotKit + LangGraph Cheat Sheet

**Quick Reference for Implementation**

---

## 🎯 Core Concepts

| Component | Purpose | Location |
|-----------|---------|----------|
| **@tool** | Backend functions LLM can call | Backend |
| **useCopilotAction** | Frontend functions backend can call | Frontend |
| **useCopilotReadable** | Share frontend state with backend | Frontend |
| **create_agent()** | Build LangGraph agent | Backend |
| **LangGraphAGUIAgent** | Wrap agent for CopilotKit | Backend |
| **CopilotKit Provider** | Initialize CopilotKit in React | Frontend |
| **CopilotSidebar/Chat** | Chat UI components | Frontend |

---

## 🔧 Backend Code Snippets

### Minimal Backend Setup

```python
# backend/agent.py
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from copilotkit import CopilotKitMiddleware, CopilotKitState
from langgraph.checkpoint.memory import MemorySaver

@tool
def my_tool(param: str) -> str:
    """Tool description for LLM."""
    # Your logic here
    return result

def build_agent():
    llm = ChatOpenAI(model="gpt-4o-mini")
    return create_agent(
        model=llm,
        tools=[my_tool],
        middleware=[CopilotKitMiddleware(expose_state=True)],
        state_schema=CopilotKitState,
        system_prompt="Your instructions here",
        checkpointer=MemorySaver(),
    )
```

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from agent import build_agent

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

compiled_graph = build_agent()
copilot_agent = LangGraphAGUIAgent(name="my-agent", graph=compiled_graph, description="...")

add_langgraph_fastapi_endpoint(app, copilot_agent, "/api/copilotkit/agents/my-agent")
sdk = CopilotKitRemoteEndpoint(agents=[copilot_agent])
add_fastapi_endpoint(app, sdk, "/api/copilotkit")

# Run: uvicorn main:app --reload --port 8000
```

---

## 🎨 Frontend Code Snippets

### Minimal Frontend Setup

```tsx
// app/layout.tsx
"use client";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="my-agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime, LangGraphAgent, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const agent = new LangGraphAgent({
  name: "my-agent",
  url: "http://localhost:8000/api/copilotkit/agents/my-agent",
});

const runtime = new CopilotRuntime({ agents: [agent] });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({ runtime, endpoint: "/api/copilotkit" });
  return handleRequest(req);
};
```

```tsx
// app/page.tsx
"use client";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Page() {
  return (
    <div className="min-h-screen p-8">
      <h1>My App</h1>
      <CopilotSidebar
        defaultOpen
        instructions="You are a helpful assistant."
        labels={{ title: "AI Assistant", initial: "👋 Ask me anything!" }}
      />
    </div>
  );
}
```

---

## 🔗 Communication Patterns

### Backend → Frontend (Call Frontend Action)

**Backend (System Prompt):**
```python
system_prompt = """
AVAILABLE FRONTEND ACTIONS:
- displayData(results: array, title: string): Show data in UI

When user asks for data:
1. Fetch using backend tools
2. Call displayData(results, title)
3. Summarize in response
"""
```

**Frontend (Register Action):**
```tsx
const [data, setData] = useState(null);

useCopilotAction({
  name: "displayData",
  description: "Display data results in the UI",
  parameters: [
    { name: "results", type: "object[]", required: true },
    { name: "title", type: "string", required: true },
  ],
  handler: async ({ results, title }) => {
    setData({ results, title });
    return "Data displayed successfully";
  },
});
```

### Frontend → Backend (Share Context)

**Frontend:**
```tsx
const [currentUser, setCurrentUser] = useState("john@example.com");

useCopilotReadable({
  description: "Currently logged-in user email",
  value: currentUser,
});
```

**Backend (Automatic):**
LLM automatically sees: "Current frontend state: currentUser = john@example.com"

---

## 🛠️ Common Patterns

### Pattern: Database Query Tool

```python
@tool
def query_database(sql: str) -> List[Dict]:
    """Execute SQL query. Use SELECT only."""
    try:
        conn = your_db_connection()
        results = conn.execute(sql).fetchall()
        return [dict(row) for row in results]
    except Exception as e:
        return [{"error": str(e)}]
```

### Pattern: API Call Tool

```python
@tool
def call_api(endpoint: str) -> Dict:
    """Fetch data from REST API."""
    try:
        response = requests.get(f"https://api.com/{endpoint}")
        return response.json()
    except Exception as e:
        return {"error": str(e)}
```

### Pattern: File Processing Tool

```python
@tool
def process_file(filename: str) -> Dict:
    """Read and process uploaded file."""
    try:
        with open(f"/uploads/{filename}", "r") as f:
            content = f.read()
        return {"content": content, "lines": len(content.split("\n"))}
    except Exception as e:
        return {"error": str(e)}
```

### Pattern: Toast Notification (Frontend)

```tsx
import { toast, Toaster } from "react-hot-toast";

useCopilotAction({
  name: "showToast",
  description: "Show notification toast",
  parameters: [
    { name: "message", type: "string", required: true },
    { name: "type", type: "string", required: false }, // 'success' | 'error'
  ],
  handler: async ({ message, type }) => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
    return "Toast shown";
  },
});

// Add component
<Toaster position="top-right" />
```

### Pattern: Loading State (Frontend)

```tsx
const [isLoading, setIsLoading] = useState(false);

useCopilotAction({
  name: "setLoading",
  parameters: [{ name: "loading", type: "boolean", required: true }],
  handler: async ({ loading }) => {
    setIsLoading(loading);
    return `Loading ${loading ? "started" : "stopped"}`;
  },
});

{isLoading && <div className="spinner">Loading...</div>}
```

---

## 🎯 System Prompt Templates

### Basic Prompt

```python
system_prompt = """You are a helpful AI assistant.

AVAILABLE TOOLS:
- query_database(sql): Execute SQL queries
- call_api(endpoint): Fetch data from API

WORKFLOW:
1. Understand user request
2. Call appropriate tool(s)
3. Analyze results
4. Provide clear answer

Always use tools to fetch real data. Never invent data.
"""
```

### Declarative UI Prompt (for Dashboards)

```python
system_prompt = """You are a dashboard builder AI.

AVAILABLE FRONTEND ACTIONS:
- buildDashboard(title, stats, charts, tables)

WORKFLOW:
1. User: "Build finance dashboard"
2. Call finance_summary() for KPIs
3. Call group_by_count() for distributions
4. Call buildDashboard() with data
5. Confirm completion

RULES:
- Always call data tools first
- stats: array of {label, value, trend}
- charts: array of {kind, title, data}
- kind: 'pie' | 'bar' | 'line' | 'area'
"""
```

### Multi-Agent Prompt

```python
system_prompt = """You are a {domain} specialist AI.

EXPERTISE: {domain_expertise}
TABLES: {domain_tables}

Always fetch real data using tools. For visualizations, use group_by_count or group_by_sum.
"""
```

---

## 📦 Package Versions

**Backend:**
```txt
copilotkit==0.1.89
ag-ui-langgraph==0.0.35
langchain-openai>=0.1.0
langgraph>=0.2.0
fastapi>=0.110.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
```

**Frontend:**
```json
{
  "@copilotkit/react-core": "^0.1.89",
  "@copilotkit/react-ui": "^0.1.89",
  "@copilotkit/runtime": "^0.1.89",
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0"
}
```

---

## 🚀 CLI Commands

### Backend

```bash
# Install packages
pip install copilotkit ag-ui-langgraph langchain-openai langgraph fastapi uvicorn python-dotenv

# Run server
cd backend
uvicorn main:app --reload --port 8000

# Test health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Frontend

```bash
# Create Next.js app
npx create-next-app@latest my-app
cd my-app

# Install CopilotKit
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

---

## 🐛 Debug Checklist

### Backend Not Starting

- [ ] Check `.env` has `OPENAI_API_KEY`
- [ ] Check port 8000 is not in use: `lsof -i :8000`
- [ ] Check imports: `python -c "import copilotkit"`
- [ ] Check logs for error messages

### Agent Not Responding

- [ ] Check backend is running: `curl http://localhost:8000/health`
- [ ] Check frontend runtime URL matches backend
- [ ] Check agent name matches across all files
- [ ] Check browser console for errors
- [ ] Check backend terminal logs

### Tools Not Being Called

- [ ] Check tool has `@tool` decorator
- [ ] Check tool has clear docstring
- [ ] Check tool is in `tools` list in `create_agent()`
- [ ] Test tool independently: `my_tool("test")`
- [ ] Check system prompt describes the tool

### Frontend Action Not Triggered

- [ ] Check `useCopilotAction` is defined before chat component
- [ ] Check action name matches in system prompt
- [ ] Check parameters match what agent sends
- [ ] Add `console.log` in handler
- [ ] Check browser console for errors

---

## 📊 Architecture Diagram

```
User Input
    ↓
CopilotChat (Frontend)
    ↓ HTTP POST
/api/copilotkit (Next.js Route)
    ↓ WebSocket
Backend Agent (FastAPI + LangGraph)
    ↓ Calls
Backend Tools (@tool functions)
    ↓ Returns
Agent Processes
    ↓ Calls
Frontend Actions (useCopilotAction)
    ↓ Updates
React State → UI Renders
```

---

## 🔐 Security Checklist

- [ ] Add authentication (JWT, OAuth)
- [ ] Validate all tool inputs
- [ ] Sanitize SQL queries (use parameterized queries)
- [ ] Rate limit API endpoints
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Add CORS whitelist (not `allow_origins=["*"]`)
- [ ] Log all agent actions
- [ ] Implement user permissions
- [ ] Monitor for abuse

---

## 🎓 Learning Path

1. **Start Here:** `IMPLEMENTATION_GUIDE.md`
2. **Migrate Existing:** `MIGRATE_EXISTING_LANGGRAPH.md`
3. **Architecture:** `ARCHITECTURE.md`
4. **Code Examples:** Review POC codebase:
   - `backend/agent.py` - Backend tools
   - `backend/main.py` - FastAPI setup
   - `frontend/app/carrier-comparison/page.tsx` - Advanced frontend

---

## 📚 Key Files in This POC

| File | Purpose |
|------|---------|
| `backend/agent.py` | Agent definitions, tools, builders |
| `backend/main.py` | FastAPI server, endpoint registration |
| `backend/tools/sqlite_tools.py` | Database query tools |
| `backend/prompt_instructions.txt` | System prompt |
| `frontend/app/layout.tsx` | CopilotKit provider setup |
| `frontend/app/api/copilotkit/route.ts` | Next.js API route |
| `frontend/app/carrier-comparison/page.tsx` | Full-featured example |
| `docs/ARCHITECTURE.md` | System architecture + diagrams |
| `docs/IMPLEMENTATION_GUIDE.md` | Step-by-step implementation |
| `docs/MIGRATE_EXISTING_LANGGRAPH.md` | Migration guide |

---

## 🎯 Quick Start (5 Minutes)

```bash
# Backend
cd backend
pip install copilotkit ag-ui-langgraph langchain-openai langgraph fastapi uvicorn
echo "OPENAI_API_KEY=sk-your-key" > .env
# Create agent.py and main.py (see examples above)
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
npx create-next-app@latest my-app
cd my-app
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
# Create layout.tsx, route.ts, page.tsx (see examples above)
npm run dev

# Visit http://localhost:3000
```

---

**Need More Help?** Read the full guides:
- `IMPLEMENTATION_GUIDE.md` - Complete implementation from scratch
- `MIGRATE_EXISTING_LANGGRAPH.md` - Migrate existing agents
- `ARCHITECTURE.md` - System design and flow diagrams

**Ready to build?** Copy code snippets from this cheat sheet and start implementing! 🚀
