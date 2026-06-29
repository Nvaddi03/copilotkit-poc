"use client";

import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import toast, { Toaster } from "react-hot-toast";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"price" | "carrier" | "savings">("price");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [scrapingCarrier, setScrapingCarrier] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDeviceFlipped, setIsDeviceFlipped] = useState<boolean>(false);

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
      setLastUpdated(new Date());
      toast.success(`Found ${args.device_name} pricing from ${args.carrier}! 📱`);
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
      setLastUpdated(new Date());
      toast.success(`Loaded ${args.plan_name} details from ${args.carrier}! 📊`);
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
      setLastUpdated(new Date());
      toast.success(`Comparison complete for ${device} across ${(carriers as any[]).length} carriers! 🔍`);
      return `Comparison rendered for ${device} across ${(carriers as any[]).length} carriers`;
    },
  });

  return (
    <div className="h-[calc(100vh-120px)] flex">
      <Toaster position="top-right" />
      {/* Left Panel - UI Rendering Area */}
      <div className="w-1/2 border-r border-slate-200 overflow-auto bg-slate-50">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">📱 MCP Apps - Carrier Comparison</h2>
                <p className="text-sm text-slate-600">Real-time pricing from Verizon, AT&T, and T-Mobile</p>
              </div>
              {(currentDevice || currentPlan || comparison) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentDevice(null);
                      setCurrentPlan(null);
                      setComparison(null);
                      toast.success("Results cleared! 🧹");
                    }}
                    className="px-3 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      toast.success("Feature coming soon! 🚀");
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button
                    onClick={() => {
                      toast.success("PDF export coming soon! 📄");
                    }}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Stats Dashboard */}
            {comparison && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-semibold mb-1">💰 Best Price</p>
                  <p className="text-2xl font-bold text-green-800">${Math.min(...comparison.carriers.map(c => c.price_full))}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-semibold mb-1">📊 Avg Price</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ${Math.round(comparison.carriers.reduce((sum, c) => sum + c.price_full, 0) / comparison.carriers.length)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-700 font-semibold mb-1">🎯 You Save</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ${Math.max(...comparison.carriers.map(c => c.price_full)) - Math.min(...comparison.carriers.map(c => c.price_full))}
                  </p>
                </div>
              </div>
            )}
          </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-white rounded-xl p-6 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-300 rounded-full animate-pulse"></div>
                <div className="w-24 h-6 bg-slate-300 rounded animate-pulse"></div>
              </div>
              <div className="w-20 h-8 bg-slate-300 rounded-full animate-pulse"></div>
            </div>
            <div className="w-48 h-8 bg-slate-300 rounded mb-2 animate-pulse"></div>
            <div className="w-32 h-4 bg-slate-200 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="w-20 h-4 bg-slate-200 rounded mb-2 animate-pulse"></div>
                <div className="w-24 h-10 bg-slate-300 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="w-20 h-4 bg-slate-200 rounded mb-2 animate-pulse"></div>
                <div className="w-24 h-10 bg-slate-300 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                  {scrapingCarrier ? `Scraping ${scrapingCarrier}...` : "Loading..."}
                </span>
                <span className="text-sm font-semibold text-slate-700">{loadingProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching real-time pricing data...</span>
            </div>
          </div>
        )}

        {/* Device Info Card with Flip Animation */}
        {currentDevice && (
          <div 
            className="mb-4 perspective-1000"
            style={{ perspective: "1000px" }}
          >
            <div
              className={`relative w-full transition-transform duration-700 transform-style-3d ${
                isDeviceFlipped ? "rotate-y-180" : ""
              }`}
              style={{
                transformStyle: "preserve-3d",
                transform: isDeviceFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front of Card */}
              <div
                className={`bg-gradient-to-br ${getCarrierColor(currentDevice.carrier).gradient} text-white rounded-xl p-6 shadow-lg backface-hidden`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCarrierColor(currentDevice.carrier).icon}</span>
                    <span className="text-lg font-bold">{currentDevice.carrier}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      currentDevice.availability.toLowerCase().includes("stock") ? "bg-green-500" : "bg-yellow-500"
                    }`}>
                      {currentDevice.availability.toLowerCase().includes("stock") ? "✓ In Stock" : currentDevice.availability}
                    </span>
                    {currentDevice.trade_in_value && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500">
                        💰 Trade-in
                      </span>
                    )}
                  </div>
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
                <div className="flex gap-2">
                  <a
                    href={currentDevice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View on {currentDevice.carrier} →
                  </a>
                  <button
                    onClick={() => setIsDeviceFlipped(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Details
                  </button>
                </div>
              </div>

              {/* Back of Card */}
              <div
                className={`absolute top-0 left-0 w-full bg-gradient-to-br ${getCarrierColor(currentDevice.carrier).gradient} text-white rounded-xl p-6 shadow-lg backface-hidden`}
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">ℹ️</span>
                    <span className="text-lg font-bold">Device Details</span>
                  </div>
                  <button
                    onClick={() => setIsDeviceFlipped(false)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
                  >
                    ← Back
                  </button>
                </div>
                
                <h3 className="text-xl font-bold mb-4">{currentDevice.device_name}</h3>
                
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs opacity-75 mb-1">Model</p>
                    <p className="font-semibold">{currentDevice.model}</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs opacity-75 mb-1">Storage</p>
                    <p className="font-semibold">{currentDevice.storage}</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs opacity-75 mb-1">Availability</p>
                    <p className="font-semibold">{currentDevice.availability}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Full Price</p>
                      <p className="text-lg font-bold">${currentDevice.price_full}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Monthly (24mo)</p>
                      <p className="text-lg font-bold">${currentDevice.price_monthly}/mo</p>
                    </div>
                  </div>
                  
                  {currentDevice.trade_in_value && (
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">💰 Trade-in Value</p>
                      <p className="text-xl font-bold">${currentDevice.trade_in_value}</p>
                      <p className="text-xs mt-1 opacity-75">
                        Final Price: ${currentDevice.price_full - currentDevice.trade_in_value}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs opacity-75 mb-1">Carrier</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCarrierColor(currentDevice.carrier).icon}</span>
                      <p className="font-semibold">{currentDevice.carrier}</p>
                    </div>
                  </div>
                </div>
                
                <a
                  href={currentDevice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block text-center bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                >
                  View Full Details on {currentDevice.carrier} →
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Last Updated Timestamp */}
        {lastUpdated && (currentDevice || currentPlan || comparison) && (
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Plan Info Card */}
        {currentPlan && (
          <div className={`bg-gradient-to-br ${getCarrierColor(currentPlan.carrier).gradient} text-white rounded-xl p-6 mb-4 shadow-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
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
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">🔍 {comparison.device} - Price Comparison</h3>
                  <p className="text-sm opacity-75">Comparing across {comparison.carriers.length} carriers</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("price")}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      sortBy === "price" ? "bg-white text-slate-900" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    💰 Price
                  </button>
                  <button
                    onClick={() => setSortBy("carrier")}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      sortBy === "carrier" ? "bg-white text-slate-900" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    📱 Carrier
                  </button>
                </div>
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-600">Lowest Price</p>
                  <p className="text-lg font-bold text-green-600">
                    ${Math.min(...comparison.carriers.map(c => c.price_full))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Highest Price</p>
                  <p className="text-lg font-bold text-red-600">
                    ${Math.max(...comparison.carriers.map(c => c.price_full))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Max Savings</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${Math.max(...comparison.carriers.map(c => c.price_full)) - Math.min(...comparison.carriers.map(c => c.price_full))}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {comparison.carriers
                .sort((a, b) => {
                  if (sortBy === "price") return a.price_full - b.price_full;
                  if (sortBy === "carrier") return a.name.localeCompare(b.name);
                  return 0;
                })
                .map((carrier, idx) => {
                const colors = getCarrierColor(carrier.name);
                const isLowest = carrier.price_full === Math.min(...comparison.carriers.map(c => c.price_full));
                const maxPrice = Math.max(...comparison.carriers.map(c => c.price_full));
                const savings = maxPrice - carrier.price_full;
                
                return (
                  <div
                    key={idx}
                    className={`p-5 transition-all duration-200 hover:bg-slate-50 cursor-pointer ${isLowest ? "bg-green-50 border-l-4 border-green-500" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{colors.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-slate-900">{carrier.name}</p>
                            {idx === 0 && <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">🏆 Best Deal</span>}
                            {carrier.trade_in_value && (
                              <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">💰 Trade-in</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Rank: #{idx + 1} of {comparison.carriers.length}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-slate-900">${carrier.price_full}</p>
                        <p className="text-sm text-slate-600">${carrier.price_monthly}/mo × 24</p>
                        {carrier.trade_in_value && (
                          <p className="text-sm text-green-600 font-semibold mt-1">
                            Save ${carrier.trade_in_value} with trade-in
                          </p>
                        )}
                        {savings > 0 && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            ${savings} cheaper than highest
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Breakdown */}
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Device Total:</span>
                        <span className="font-semibold">${carrier.price_full}</span>
                      </div>
                      {carrier.trade_in_value && (
                        <div className="flex justify-between text-green-600">
                          <span>Trade-in Value:</span>
                          <span className="font-semibold">-${carrier.trade_in_value}</span>
                        </div>
                      )}
                    </div>
                    
                    {carrier.trade_in_value && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-center">
                        <p className="text-sm font-bold text-green-800">
                          Final Price: ${carrier.price_full - (carrier.trade_in_value || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!currentDevice && !currentPlan && !comparison && (
          <div className="text-center py-12">
            <div className="animate-bounce mb-4">
              <p className="text-6xl">📱</p>
            </div>
            <p className="text-lg font-semibold mb-2 text-slate-900">Ready to Compare Carriers?</p>
            <p className="text-sm text-slate-600 mb-6">Ask about devices or plans in the chat →</p>
            
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto text-left">
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-red-800 mb-1">🔴 Verizon Query</p>
                <p className="text-xs text-red-700">"Show me iPhone 15 Pro on Verizon"</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-blue-800 mb-1">🔵 AT&T Plans</p>
                <p className="text-xs text-blue-700">"What are AT&T unlimited plans for 2 lines?"</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-purple-800 mb-1">🟣 Multi-Carrier</p>
                <p className="text-xs text-purple-700">"Compare iPhone 15 Pro across all carriers"</p>
              </div>
            </div>
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
