# Implementation Plan for CopilotKit Full POC

## 1. Feature Mapping (Matrix → Files)

| Feature | Files/Modules |
|---|---|
| Chat sidebar / popup / inline | frontend/app/page.tsx, frontend/app/controlled/page.tsx, frontend/app/declarative/page.tsx, frontend/app/open/page.tsx |
| Reading app state into the LLM | frontend/lib/copilot-config.ts, backend/tools/sqlite_tools.py |
| Frontend actions | frontend/components/*, frontend/lib/copilot-config.ts |
| Backend/Python actions | backend/tools/sqlite_tools.py, backend/tools/analytics_tools.py |
| Suggestions | frontend/lib/copilot-config.ts |
| Headless UI | frontend/app/page.tsx |
| Streaming, interruption, human-in-the-loop | backend/main.py, backend/agent.py |
| Shared state (CoAgents) | frontend/lib/copilot-config.ts, backend/agent.py |
| Controlled GenUI | frontend/app/controlled/page.tsx, frontend/components/FlightCard.tsx, PieChart.tsx |
| Declarative GenUI | frontend/app/declarative/page.tsx, frontend/components/A2UICatalog.tsx |
| Open GenUI | frontend/app/open/page.tsx, backend/runtime/server.ts |
| LangChain/LangGraph agent | backend/agent.py |
| AG-UI endpoint | backend/main.py |
| CopilotKitMiddleware | backend/main.py |
| OpenAI model | backend/agent.py, .env.example |
| SQLite tools | backend/tools/sqlite_tools.py |
| Domain-specific DB | data/seed.py, backend/tools/sqlite_tools.py |

## 2. Build Steps

1. Clone repo and set up `.env`.
2. Create Python virtualenv in `backend/` and install requirements.
3. Install Node dependencies in `frontend/` and `backend/runtime/`.
4. Run `data/seed.py` to create and populate SQLite DB.
5. Start all services with `bash scripts/dev.sh`.
6. Implement and test each L2–L5 demo page and domain-specific tools/components.
7. After implementation, generate `docs/features.html` with real code samples.

## 3. Acceptance Tests

| Test | Steps | Expected |
|---|---|---|
| Chat works | Open `/`, type "hello" | Streaming reply from OpenAI |
| Readable state | "What products are in stock?" | Agent reads `products` table via tool |
| Frontend action | "Add a customer named Alice" | UI updates + row appears in SQLite |
| Controlled GenUI | "Show me flight NYC→LON on Friday" | `<FlightCard/>` renders in chat |
| Declarative GenUI | "Build a sales dashboard" | A2UI composes layout from catalog |
| Open GenUI | "Draw a flowchart of our order pipeline" | Excalidraw MCP app opens in chat |
| Shared state | Edit todo in UI | Agent sees change next turn |
| Suggestions | New chat | 3 starter suggestions appear |

## 4. Risks / Open Questions

- Library API changes or missing documentation.
- Integration issues between Python backend and Node runtime.
- UI/UX complexity for "wow factor" across all domains.
- OpenAI API limits or key issues.
- MCP app integration (Excalidraw) reliability.

## 5. Verification

- All acceptance tests must pass.
- Each domain and L2–L5 demo must be independently accessible and visually distinct.
- `docs/features.html` must reflect actual implemented features and code.
