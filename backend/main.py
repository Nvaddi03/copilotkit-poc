from fastapi import FastAPI
from dotenv import load_dotenv

# Load env vars (OPENAI_API_KEY etc.) before importing modules that need them
load_dotenv()

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from fastapi.middleware.cors import CORSMiddleware

# --- Compatibility shim --------------------------------------------------
# copilotkit 0.1.89's LangGraphAGUIAgent.dict_repr calls super().dict_repr(),
# but ag_ui_langgraph.LangGraphAgent (0.0.35) does not implement it. Provide
# a minimal default so the /info endpoint can serialize the agent.
from ag_ui_langgraph import LangGraphAgent as _BaseLGAgent

if not hasattr(_BaseLGAgent, "dict_repr"):
    def _default_dict_repr(self):  # type: ignore[no-redef]
        return {
            "name": getattr(self, "name", "agent"),
            "description": getattr(self, "description", "") or "",
        }
    _BaseLGAgent.dict_repr = _default_dict_repr  # type: ignore[attr-defined]
# -------------------------------------------------------------------------

from agent import build_agent, build_finance_agent, build_hr_agent, build_healthcare_agent, build_wireless_agent, build_weather_agent

app = FastAPI()

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build the compiled LangGraph agent
compiled_graph = build_agent()

# ── Domain-specialist agents for Multi-Agent Routing demo ─────────────
finance_graph = build_finance_agent()
hr_graph = build_hr_agent()
healthcare_graph = build_healthcare_agent()
wireless_graph = build_wireless_agent()
weather_graph  = build_weather_agent()

# Wrap it as a CopilotKit AG-UI agent
copilot_agent = LangGraphAGUIAgent(
    name="copilotkit-agent",
    graph=compiled_graph,
    description="Multi-domain (Finance, HR, Healthcare, Wireless) data assistant.",
    config={"recursion_limit": 20},
)

# Domain-specialist agents
finance_agent = LangGraphAGUIAgent(
    name="finance-agent",
    graph=finance_graph,
    description="Finance specialist: accounts, transactions, budgets, P&L.",
    config={"recursion_limit": 20},
)
hr_agent = LangGraphAGUIAgent(
    name="hr-agent",
    graph=hr_graph,
    description="HR specialist: employees, payroll, attrition, headcount.",
    config={"recursion_limit": 20},
)
healthcare_agent = LangGraphAGUIAgent(
    name="healthcare-agent",
    graph=healthcare_graph,
    description="Healthcare specialist: patients, appointments, compliance.",
    config={"recursion_limit": 20},
)
wireless_agent = LangGraphAGUIAgent(
    name="wireless-agent",
    graph=wireless_graph,
    description="Wireless specialist: subscribers, usage, churn, plans.",
    config={"recursion_limit": 20},
)
weather_agent = LangGraphAGUIAgent(
    name="weather-agent",
    graph=weather_graph,
    description="Real-time weather assistant using Open-Meteo: current conditions, forecasts, hourly charts, city comparisons.",
    config={"recursion_limit": 20},
)

# Mount the AG-UI streaming endpoint FIRST so it wins over the catch-all
# registered by add_fastapi_endpoint below.
add_langgraph_fastapi_endpoint(
    app,
    copilot_agent,
    path="/api/copilotkit/agents/copilotkit-agent",
)

# Domain-specialist agent endpoints for Multi-Agent Routing
for _agent in [finance_agent, hr_agent, healthcare_agent, wireless_agent, weather_agent]:
    add_langgraph_fastapi_endpoint(
        app,
        _agent,
        path=f"/api/copilotkit/agents/{_agent.name}",
    )

# Register the legacy CopilotKit remote endpoint (catch-all) for /info etc.
sdk = CopilotKitRemoteEndpoint(agents=[copilot_agent, finance_agent, hr_agent, healthcare_agent, wireless_agent, weather_agent])
add_fastapi_endpoint(app, sdk, "/api/copilotkit")


@app.get("/health")
def health():
    return {"status": "ok"}
