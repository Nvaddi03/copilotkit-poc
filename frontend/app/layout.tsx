import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import type { Metadata } from "next";
import Link from "next/link";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "CopilotKit POC",
  description:
    "CopilotKit POC - proof of concept app",
};

const NAV = [
  { href: "/",            label: "Dashboard" },
  { href: "/controlled",  label: "L3 · Controlled GenUI" },
  { href: "/declarative", label: "L4 · Declarative GenUI" },
  { href: "/open",        label: "L5 · Open GenUI" },
  { href: "/hitl",        label: "HITL · Approvals" },
  { href: "/chat",        label: "Custom Chat" },
  { href: "/multiagent",  label: "Multi-Agent" },
  { href: "/rag",         label: "RAG Search" },
  { href: "/multimodal",  label: "Vision" },
  { href: "/voice",       label: "Voice" },
  { href: "/external-api", label: "🌤️ Weather External API" },
  { href: "/carrier-comparison", label: "📱 MCP Apps - Carrier Comparison" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ClientLayoutWrapper>
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
            <div className="flex items-center gap-6 px-6 py-3">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🪁</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
