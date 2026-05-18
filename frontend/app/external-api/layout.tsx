/**
 * MCP page layout — overrides the root layout's CopilotProvider.
 * Each MCP demo page will provide its own CopilotKit context with a specific agent.
 */
export default function MCPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No CopilotProvider wrapper here — each page provides its own
  return <>{children}</>;
}
