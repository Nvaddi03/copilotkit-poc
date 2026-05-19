"use client";

/**
 * CopilotProvider — client component wrapper for <CopilotKit>.
 *
 * Demonstrates two advanced features:
 *
 * 1. threadId persistence — store the active thread ID in localStorage so
 *    conversations survive page refreshes within the same browser session.
 *    (With SqliteSaver backend this would persist across restarts too.)
 *
 * 2. CopilotObservabilityHooks — exported for use on CopilotChat widgets.
 *    observabilityHooks is a prop on CopilotChat/CopilotSidebar/CopilotPopup,
 *    not on <CopilotKit> itself. See dashboard page for usage.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core";
import { COPILOT_RUNTIME_URL, COPILOT_AGENT_NAME } from "../lib/copilot-config";

const THREAD_STORAGE_KEY_PREFIX = "copilotkit-poc-thread-";

// ── Observability log (kept in module scope so it survives re-renders) ──────
type ObsEntry = { ts: string; event: string; detail: string };
const obsLog: ObsEntry[] = [];

function pushLog(event: string, detail: string) {
  obsLog.unshift({ ts: new Date().toLocaleTimeString(), event, detail });
  if (obsLog.length > 100) obsLog.pop();
  // Emit a custom DOM event so any interested component can react
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("copilot-obs", { detail: { event, detail } }));
  }
}

// Export so other pages can read the log
export function getObsLog(): ObsEntry[] {
  return obsLog;
}

export default function CopilotProvider({
  children,
  agentName,
}: {
  children: React.ReactNode;
  agentName?: string;
}) {
  const pathname = usePathname();
  // ── Thread ID persistence (route-specific) ──────────────────────────────
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Create route-specific storage key (e.g., "copilotkit-poc-thread-/controlled")
    const storageKey = `${THREAD_STORAGE_KEY_PREFIX}${pathname || 'default'}`;
    
    // Always generate a fresh thread ID when navigating to a new route
    // This ensures each module starts with a clean conversation
    const fresh = crypto.randomUUID();
    localStorage.setItem(storageKey, fresh);
    setThreadId(fresh);
  }, [pathname]);

  return (
    <CopilotKit
      key={`copilotkit-${agentName || COPILOT_AGENT_NAME}`}
      runtimeUrl={COPILOT_RUNTIME_URL}
      agent={agentName || COPILOT_AGENT_NAME}
      threadId={threadId}
      headers={{
        "x-user-id": "demo-user",
        "x-session": "poc-session",
        "x-app-version": "1.0.0",
      }}
    >
      {children}
    </CopilotKit>
  );
}
