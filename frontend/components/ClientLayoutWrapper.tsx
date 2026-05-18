"use client";

/**
 * ClientLayoutWrapper — provides a single CopilotProvider with route-based agent selection.
 * 
 * Different routes can use different agents without nested providers.
 * The agent prop is determined by the current pathname.
 */

import { usePathname } from "next/navigation";
import CopilotProvider from "./CopilotProvider";

// Map routes to their specific agents
const ROUTE_AGENT_MAP: Record<string, string> = {
  "/external-api": "weather-agent",
  "/multiagent": "copilotkit-agent", // Could use routing agent here
};

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Find the agent for the current route
  let agentName = "copilotkit-agent"; // default
  for (const [route, agent] of Object.entries(ROUTE_AGENT_MAP)) {
    if (pathname?.startsWith(route)) {
      agentName = agent;
      break;
    }
  }

  // Debug logging
  if (typeof window !== "undefined") {
    console.log(`[ClientLayoutWrapper] pathname: ${pathname}, agent: ${agentName}`);
  }

  // Single provider with route-specific agent
  return <CopilotProvider agentName={agentName}>{children}</CopilotProvider>;
}
