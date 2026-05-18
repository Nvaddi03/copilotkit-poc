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
const AGENT_NAME = "copilotkit-agent";

const runtime = new CopilotRuntime({
  agents: {
    [AGENT_NAME]: new (LangGraphHttpAgent as any)({
      url: `${REMOTE_BASE}/agents/${AGENT_NAME}`,
    }),
  } as any,
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
