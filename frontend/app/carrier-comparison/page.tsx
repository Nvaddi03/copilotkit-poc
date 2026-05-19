"use client";

import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

// ── Types ─────────────────────────────────────────────────────────────────
type DeviceInfo = {
  carrier: string;
  device_name: string;
  model: string;
  storage: string;
  price_full: number;
  price_monthly: number;
  trade_in_value?: number;
  availability: string;
  url: string;
};

type PlanInfo = {
  carrier: string;
  plan_name: string;
  price_per_line: number;
  num_lines: number;
  total_monthly: number;
  features: string[];
  data_limit: string;
  hotspot?: string;
};

type ComparisonData = {
  device: string;
  carriers: Array<{
    name: string;
    price_full: number;
    price_monthly: number;
    trade_in_value?: number;
    savings?: number;
  }>;
};

// ── Helper functions ──────────────────────────────────────────────────────
function getCarrierColor(carrier: string): { gradient: string; icon: string; text: string } {
  const normalized = carrier.toLowerCase();
  if (normalized.includes("verizon")) {
    return { gradient: "from-red-600 to-red-700", icon: "🔴", text: "text-red-700" };
  }
  if (normalized.includes("att") || normalized.includes("at&t")) {
    return { gradient: "from-blue-600 to-blue-700", icon: "🔵", text: "text-blue-700" };
  }
  if (normalized.includes("t-mobile") || normalized.includes("tmobile")) {
    return { gradient: "from-purple-600 to-purple-700", icon: "🟣", text: "text-purple-700" };
  }
  return { gradient: "from-gray-600 to-gray-700", icon: "📱", text: "text-gray-700" };
}

// ── Inner component (needs CopilotKit context) ─────────────────────────────
function CarrierComparisonInner() {
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>("");

  // ── useCopilotReadable — expose UI state to agent ──────────────────
  useCopilotReadable({
    description: "Currently displayed carrier comparison data",
    value: {
      activeQuery,
      hasDevice: !!currentDevice,
      hasPlan: !!currentPlan,
      hasComparison: !!comparison,
    },
  });

  // ── Action: render device info card ───────────────────────────────
  useCopilotAction({
    name: "renderDeviceInfo",
    description: "Display device pricing and details from a carrier. Call this after get_device_info from MCP server.",
    parameters: [
      { name: "carrier", type: "string", required: true },
      { name: "device_name", type: "string", required: true },
      { name: "model", type: "string", required: true },
      { name: "storage", type: "string", required: true },
      { name: "price_full", type: "number", required: true },
      { name: "price_monthly", type: "number", required: true },
      { name: "trade_in_value", type: "number", required: false },
      { name: "availability", type: "string", required: true },
      { name: "url", type: "string", required: true },
    ],
    handler: async (args) => {
      setCurrentDevice(args as DeviceInfo);
      setActiveQuery(args.device_name as string);
      setCurrentPlan(null);
      setComparison(null);
      return `Device card rendered for ${args.device_name} on ${args.carrier}`;
    },
  });

  // ── Action: render plan info card ─────────────────────────────────
  useCopilotAction({
    name: "renderPlanInfo",
    description: "Display carrier plan pricing and features. Call this after get_plans from MCP server.",
    parameters: [
      { name: "carrier", type: "string", required: true },
      { name: "plan_name", type: "string", required: true },
      { name: "price_per_line", type: "number", required: true },
      { name: "num_lines", type: "number", required: true },
      { name: "total_monthly", type: "number", required: true },
      { name: "features", type: "string[]", required: true },
      { name: "data_limit", type: "string", required: true },
      { name: "hotspot", type: "string", required: false },
    ],
    handler: async (args) => {
      setCurrentPlan(args as PlanInfo);
      setActiveQuery(args.plan_name as string);
      setCurrentDevice(null);
      setComparison(null);
      return `Plan card rendered for ${args.plan_name} from ${args.carrier}`;
    },
  });

  // ── Action: render multi-carrier comparison ────────────────────────
  useCopilotAction({
    name: "renderCarrierComparison",
    description: "Display side-by-side comparison of device prices across multiple carriers.",
    parameters: [
      { name: "device", type: "string", required: true },
      {
        name: "carriers",
        type: "object[]",
        required: true,
        attributes: [
          { name: "name", type: "string", required: true },
          { name: "price_full", type: "number", required: true },
          { name: "price_monthly", type: "number", required: true },
          { name: "trade_in_value", type: "number", required: false },
          { name: "savings", type: "number", required: false },
        ],
      },
    ],
    handler: async ({ device, carriers }) => {
      setComparison({ device, carriers } as ComparisonData);
      setActiveQuery(device as string);
      setCurrentDevice(null);
      setCurrentPlan(null);
      return `Comparison rendered for ${device} across ${(carriers as any[]).length} carriers`;
    },
  });

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Left Panel - UI Rendering Area */}
      <div className="w-1/2 border-r border-slate-200 overflow-auto bg-slate-50">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">📱 MCP Apps - Carrier Comparison</h2>
            <p className="text-sm text-slate-600">Real-time pricing from Verizon, AT&T, and T-Mobile</p>
          </div>

        {/* Device Info Card */}
        {currentDevice && (
          <div className={`bg-gradient-to-br ${getCarrierColor(currentDevice.carrier).gradient} text-white rounded-xl p-6 mb-4 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCarrierColor(currentDevice.carrier).icon}</span>
                <span className="text-lg font-bold">{currentDevice.carrier}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentDevice.availability.toLowerCase().includes("stock") ? "bg-green-500" : "bg-yellow-500"
              }`}>
                {currentDevice.availability}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentDevice.device_name}</h3>
            <p className="text-sm opacity-90 mb-4">{currentDevice.model} • {currentDevice.storage}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm opacity-75">Full Price</p>
                <p className="text-3xl font-bold">${currentDevice.price_full}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Monthly</p>
                <p className="text-3xl font-bold">${currentDevice.price_monthly}/mo</p>
              </div>
            </div>
            {currentDevice.trade_in_value && (
              <div className="bg-white/20 rounded-lg p-3 mb-4">
                <p className="text-sm">💰 Trade-in Credit: <span className="font-bold">${currentDevice.trade_in_value}</span></p>
              </div>
            )}
            <a
              href={currentDevice.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              View on {currentDevice.carrier} →
            </a>
          </div>
        )}

        {/* Plan Info Card */}
        {currentPlan && (
          <div className={`bg-gradient-to-br ${getCarrierColor(currentPlan.carrier).gradient} text-white rounded-xl p-6 mb-4 shadow-lg`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{getCarrierColor(currentPlan.carrier).icon}</span>
              <span className="text-lg font-bold">{currentPlan.carrier}</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentPlan.plan_name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm opacity-75">Per Line</p>
                <p className="text-3xl font-bold">${currentPlan.price_per_line}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Total ({currentPlan.num_lines} lines)</p>
                <p className="text-3xl font-bold">${currentPlan.total_monthly}/mo</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold mb-2">📊 {currentPlan.data_limit}</p>
              {currentPlan.hotspot && <p className="text-sm">📡 {currentPlan.hotspot}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">✨ Features:</p>
              {currentPlan.features.map((feature: any, idx: number) => (
                <p key={idx} className="text-sm opacity-90">
                  • {typeof feature === 'string' ? feature : feature?.feature || JSON.stringify(feature)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {comparison && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-xl font-bold">🔍 {comparison.device} - Price Comparison</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {comparison.carriers.map((carrier, idx) => {
                const colors = getCarrierColor(carrier.name);
                const isLowest = carrier.price_full === Math.min(...comparison.carriers.map(c => c.price_full));
                return (
                  <div
                    key={idx}
                    className={`p-4 flex items-center justify-between ${isLowest ? "bg-green-50 border-l-4 border-green-500" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{colors.icon}</span>
                      <div>
                        <p className="font-bold text-slate-900">{carrier.name}</p>
                        {isLowest && <span className="text-xs font-semibold text-green-600">🏆 Best Price</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">${carrier.price_full}</p>
                      <p className="text-sm text-slate-600">${carrier.price_monthly}/mo</p>
                      {carrier.trade_in_value && (
                        <p className="text-xs text-green-600 font-semibold">-${carrier.trade_in_value} trade-in</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!currentDevice && !currentPlan && !comparison && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-6xl mb-4">📱</p>
            <p className="text-lg font-semibold mb-2">No data displayed yet</p>
            <p className="text-sm">Ask about devices or plans in the chat →</p>
          </div>
        )}
        </div>
      </div>

      {/* Right Panel - CopilotChat */}
      <div className="w-1/2 flex flex-col">
        <div className="bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white p-4">
          <h2 className="text-lg font-bold">💬 Ask About Carriers</h2>
          <p className="text-sm opacity-90">Compare devices and plans across carriers</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <CopilotChat
            labels={{
              title: "Carrier Assistant",
              initial:
                "👋 Ask me about device prices and plans from Verizon, AT&T, and T-Mobile!\n\n" +
                "**Try these queries:**\n" +
                "• \"Show me iPhone 15 Pro on Verizon\"\n" +
                "• \"What are AT&T's unlimited plans for 2 lines?\"\n" +
                "• \"Compare iPhone 15 Pro prices across all carriers\"\n" +
                "• \"Show me Samsung Galaxy S24 on T-Mobile\"\n\n" +
                "💡 **How it works:**\n" +
                "1. Your query is sent to the LLM\n" +
                "2. LLM determines intent & calls the right MCP server\n" +
                "3. MCP server fetches real data (web scraping + cache)\n" +
                "4. LLM calls `renderDeviceInfo` or `renderPlanInfo` actions\n" +
                "5. UI updates with live data on the left panel",
            }}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function CarrierComparisonPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="copilotkit-agent">
      <CarrierComparisonInner />
    </CopilotKit>
  );
}
