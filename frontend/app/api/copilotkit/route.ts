import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";

// CopilotKitRemoteEndpoint on the FastAPI backend exposes each agent under
//   <base>/agents/<name>  using the AG-UI HTTP protocol.
const REMOTE_BASE =
  process.env.COPILOTKIT_REMOTE_URL || "http://localhost:8000/api/copilotkit";

// Register all available agents from the backend
const AGENT_NAMES = [
  "copilotkit-agent",
  "finance-agent",
  "hr-agent",
  "healthcare-agent",
  "wireless-agent",
  "weather-agent",
];

// Build agents object dynamically
const agents: Record<string, any> = {};
for (const agentName of AGENT_NAMES) {
  agents[agentName] = new (LangGraphHttpAgent as any)({
    url: `${REMOTE_BASE}/agents/${agentName}`,
  });
}

const runtime = new CopilotRuntime({
  agents: agents as any,
  // MCP (Model Context Protocol) Servers for carrier comparison
  mcpServers: [
    {
      endpoint: process.env.VERIZON_MCP_URL || "http://localhost:8001",
    },
    {
      endpoint: process.env.ATT_MCP_URL || "http://localhost:8002",
    },
    {
      endpoint: process.env.TMOBILE_MCP_URL || "http://localhost:8003",
    }
  ]
});

// The backend agent provides the LLM, so we use an empty adapter here.
const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
