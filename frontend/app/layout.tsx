import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import type { Metadata } from "next";
import Link from "next/link";
import { CopilotKit } from "@copilotkit/react-core";
import { COPILOT_RUNTIME_URL, COPILOT_AGENT_NAME } from "../lib/copilot-config";

export const metadata: Metadata = {
  title: "CopilotKit POC – Multi-Domain Assistant",
  description:
    "CopilotKit + LangGraph + FastAPI + SQLite demo across Finance, HR, Healthcare, and Wireless.",
};

const NAV = [
  { href: "/",           label: "Dashboard" },
  { href: "/controlled", label: "L3 · Controlled GenUI" },
  { href: "/declarative", label: "L4 · Declarative GenUI" },
  { href: "/open",       label: "L5 · Open GenUI" },
  { href: "/hitl",       label: "HITL · Approvals" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <CopilotKit runtimeUrl={COPILOT_RUNTIME_URL} agent={COPILOT_AGENT_NAME}>
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🪁</span>
                <span className="font-semibold text-slate-900">
                  CopilotKit POC
                </span>
              </Link>
              <nav className="flex gap-1 text-sm">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="px-3 py-2 rounded-md text-slate-600 hover:text-brand-600 hover:bg-brand-50"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </CopilotKit>
      </body>
    </html>
  );
}
