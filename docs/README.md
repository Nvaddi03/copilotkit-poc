# 📚 Documentation

**Complete guide to implementing CopilotKit with your LangGraph agents.**

---

## 🎯 Quick Start

### Already using `langgraph dev`? (Fastest)
👉 **[CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md)** - 15 minutes, zero backend changes

### Building from scratch?
👉 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete system

### Migrating existing Python agents?
👉 **[MIGRATE_EXISTING_LANGGRAPH.md](./MIGRATE_EXISTING_LANGGRAPH.md)** - Step-by-step migration

### Need quick reference?
👉 **[CHEAT_SHEET.md](./CHEAT_SHEET.md)** - Code snippets & patterns

---

## 📖 Full Documentation

**[👉 DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete guide with decision matrix

---

## 🚀 What You'll Build

```
User ←→ CopilotKit UI ←→ Your LangGraph Agent ←→ Your Data/APIs
```

**Features:**
- ✅ Chat interface (sidebar, popup, or inline)
- ✅ Backend tools agent can call
- ✅ Frontend actions agent can trigger
- ✅ Real-time streaming responses
- ✅ Multi-agent routing
- ✅ Production-ready architecture

---

## 📊 Choose Your Path

| Your Situation | Guide | Time |
|---------------|-------|------|
| 🚀 Using `langgraph dev` | [CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md) | 15 min |
| 🏗️ Building from scratch | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | 2-3 hrs |
| 🔄 Migrating Python agents | [MIGRATE_EXISTING_LANGGRAPH.md](./MIGRATE_EXISTING_LANGGRAPH.md) | 1 hr |

---

## 📚 All Guides

1. **[CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md)** ⭐ NEW!
   - Connect to existing `langgraph dev` agents
   - Zero backend modifications
   - Fastest path to UI

2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)**
   - Build complete system from scratch
   - FastAPI backend + Next.js frontend
   - Full architecture explanation

3. **[MIGRATE_EXISTING_LANGGRAPH.md](./MIGRATE_EXISTING_LANGGRAPH.md)**
   - Add CopilotKit to existing Python agents
   - Minimal code changes
   - FastAPI wrapper

4. **[CHEAT_SHEET.md](./CHEAT_SHEET.md)**
   - Quick reference
   - Code snippets
   - Common patterns
   - Debug checklist

5. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - System design
   - Mermaid diagrams
   - Data flow explanations

6. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**
   - Complete navigation guide
   - Decision matrix
   - Learning paths

---

## 🎓 Learning Path

**Beginner (30 min):**
1. Read [CONNECT_LANGGRAPH_CLI.md](./CONNECT_LANGGRAPH_CLI.md) intro
2. Follow Quick Setup
3. Test with prompts

**Intermediate (1 day):**
1. Choose: CLI vs FastAPI
2. Read implementation guide
3. Build full application
4. Add custom features

**Advanced (1-2 weeks):**
1. Study [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Implement multi-agent system
3. Add RAG, MCP servers
4. Deploy to production

---

## 💡 Key Concepts

**Backend Tools** (`@tool`):
- Functions your agent can call
- Database queries, API calls, file processing
- Defined in `agent.py` (FastAPI) or your existing agent code

**Frontend Actions** (`useCopilotAction`):
- Functions your agent can trigger in the UI
- Display data, show charts, update state
- Defined in React components

**Data Flow:**
```
User → CopilotKit UI → Backend Agent → Tools → Data
                                    ↓
                              Frontend Actions → UI Updates
```

---

## 🐛 Troubleshooting

**Agent not responding?**
- Check backend is running: `curl http://localhost:8000/health` (FastAPI) or `curl http://localhost:2024/info` (CLI)
- Verify agent name matches across all files
- Check browser console + backend logs

**Tools not being called?**
- Check tool has `@tool` decorator and clear docstring
- Verify tool is in agent's tools list
- Test tool independently

**Frontend actions not working?**
- Define actions before chat component
- Match action names in agent's system prompt
- Check browser console for errors

→ Full debug guide: [CHEAT_SHEET.md](./CHEAT_SHEET.md) - Debug Checklist

---

## 🚀 Quick Example

**Backend Tool:**
```python
@tool
def get_sales_data(query: str) -> dict:
    """Fetch sales data from database."""
    return {"sales": 1000, "region": "US"}
```

**Frontend Action:**
```tsx
useCopilotAction({
  name: "showChart",
  parameters: [{ name: "data", type: "object[]" }],
  handler: async ({ data }) => {
    setChartData(data);
    return "Chart displayed";
  },
});
```

**Agent System Prompt:**
```python
"When user asks for sales visualization:
1. Call get_sales_data()
2. Call showChart(data)
3. Summarize insights"
```

---

## 🎯 Next Steps

1. ✅ **[Read DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Choose your path
2. ✅ **Follow chosen guide** - Step-by-step implementation
3. ✅ **Reference CHEAT_SHEET.md** - During development
4. ✅ **Deploy** - Production guide in each implementation doc

---

**Ready?** Start with **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** to choose your path! 🚀
