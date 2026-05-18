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

from agent import build_agent

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

# Wrap it as a CopilotKit AG-UI agent
copilot_agent = LangGraphAGUIAgent(
    name="copilotkit-agent",
    graph=compiled_graph,
    description="Multi-domain (Finance, HR, Healthcare, Wireless) data assistant.",
    # Tight recursion limit: a normal chart turn is 2 tool calls
    # (1 data + 1 render) = ~4 graph steps. 20 leaves headroom for a
    # dashboard with 3 data calls + render, while failing fast if the
    # model starts looping (prevents INCOMPLETE_STREAM / timeouts).
    config={"recursion_limit": 20},
)

# Mount the AG-UI streaming endpoint FIRST so it wins over the catch-all
# registered by add_fastapi_endpoint below. The CopilotKit Next.js runtime's
# LangGraphHttpAgent speaks AG-UI (SSE), not the legacy CopilotKit JSON
# protocol, so we expose the graph at a dedicated path it can target.
add_langgraph_fastapi_endpoint(
    app,
    copilot_agent,
    path="/api/copilotkit/agents/copilotkit-agent",
)

# Register the legacy CopilotKit remote endpoint (catch-all) for /info etc.
sdk = CopilotKitRemoteEndpoint(agents=[copilot_agent])
add_fastapi_endpoint(app, sdk, "/api/copilotkit")


@app.get("/health")
def health():
    return {"status": "ok"}
