# Implementation Plan: Verizon Multi-Carrier Comparison Assistant

**Project**: CopilotKit + MCP Integration for Carrier Comparison  
**Duration**: 4 weeks (20 working days)  
**Team Size**: 1 developer  
**Status**: Planning Phase  
**Created**: May 18, 2026  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Decision](#architecture-decision)
3. [Project Structure](#project-structure)
4. [Phase 1: POC (Week 1)](#phase-1-poc-week-1)
5. [Phase 2: Multi-Carrier (Week 2)](#phase-2-multi-carrier-week-2)
6. [Phase 3: Charts & Advanced UI (Week 3)](#phase-3-charts--advanced-ui-week-3)
7. [Phase 4: Coverage Maps (Week 4)](#phase-4-coverage-maps-week-4)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)
10. [Rollback Strategy](#rollback-strategy)
11. [Success Metrics](#success-metrics)

---

## 🎯 Project Overview

### Objective
Build an AI-powered carrier comparison assistant that allows Verizon customers to compare devices, plans, and coverage across Verizon, AT&T, and T-Mobile using real-time data.

### Key Features
- ✅ Device comparison with product images
- ✅ Plan comparison tables (3 carriers)
- ✅ Price trend charts
- ✅ Interactive coverage maps
- ✅ Promotion tracking
- ✅ Line-based cost optimization

### Technical Stack
```
Frontend: Next.js 14 + TypeScript + TailwindCSS
Backend:  Python 3.11 + FastAPI + LangGraph
AI:       CopilotKit v1.10.5 + LangChain
MCP:      Model Context Protocol SDK
Charts:   Recharts
Maps:     Leaflet (react-leaflet)
Scraping: Playwright + BeautifulSoup4
```

### Dependencies
**Existing Infrastructure:**
- ✅ Next.js app with CopilotKit configured
- ✅ FastAPI backend with 6 agents
- ✅ Agent routing via ClientLayoutWrapper
- ✅ Weather external API as reference implementation

**What We're Building:**
- 🆕 Carrier comparison agent
- 🆕 MCP servers for 3 carriers
- 🆕 Device/plan comparison UI
- 🆕 Chart components
- 🆕 Coverage map integration

---

## 🏗️ Architecture Decision

### Option 1: True MCP Servers (Chosen) ✅
**Pros:**
- Protocol-level isolation
- Can be deployed independently
- Follows MCP specification
- Future-proof for ecosystem

**Cons:**
- More setup complexity
- Need MCP SDK

### Option 2: Simple Tools (Alternative)
**Pros:**
- Faster initial development
- Uses existing tools pattern

**Cons:**
- Tightly coupled to agent
- Harder to scale

**Decision**: Go with **Option 1 (True MCP)** for production-quality code.

---

## 📁 Project Structure

### New Files to Create

```
copilotkit-poc/
├── frontend/
│   ├── app/
│   │   └── carrier-comparison/          # 🆕 NEW PAGE
│   │       └── page.tsx
│   └── components/
│       └── carrier/                     # 🆕 NEW COMPONENTS
│           ├── DeviceCard.tsx
│           ├── DeviceComparison.tsx
│           ├── PlanComparisonTable.tsx
│           ├── PriceTrendChart.tsx
│           ├── CostBreakdownChart.tsx
│           └── CoverageMap.tsx
│
├── backend/
│   ├── mcp_servers/                     # 🆕 NEW MCP SERVERS
│   │   ├── __init__.py
│   │   ├── verizon_mcp.py
│   │   ├── att_mcp.py
│   │   ├── tmobile_mcp.py
│   │   └── coverage_mcp.py
│   │
│   ├── tools/
│   │   └── carrier_tools.py             # 🆕 NEW TOOLS
│   │
│   ├── agents/
│   │   └── carrier_agent.py             # 🆕 NEW AGENT
│   │
│   └── scrapers/                        # 🆕 NEW SCRAPERS
│       ├── __init__.py
│       ├── verizon_scraper.py
│       ├── att_scraper.py
│       └── tmobile_scraper.py
│
├── data/
│   └── mock_carrier_data.json           # 🆕 MOCK DATA FOR TESTING
│
└── docs/
    ├── verizon-mcp-vision.md            # ✅ EXISTS
    ├── technical-feasibility-mcp-copilotkit.md  # ✅ EXISTS
    └── implementation-plan-carrier-comparison.md  # 📄 THIS FILE
```

---

## 🚀 Phase 1: POC (Week 1)

### Goal
Build a working proof of concept with **single device comparison** (iPhone 17) across **Verizon only**, using **mock data**.

### Duration: 5 days

### Day 1: Setup & Infrastructure

**Tasks:**
- [ ] 1.1: Create new route `/app/carrier-comparison/page.tsx`
- [ ] 1.2: Create component folder `/components/carrier/`
- [ ] 1.3: Create backend folders (mcp_servers, scrapers)
- [ ] 1.4: Install dependencies (recharts, leaflet)
- [ ] 1.5: Create mock data file

**Deliverables:**
- Empty page renders at `/carrier-comparison`
- Component folder structure ready
- Mock data JSON with sample devices

**Code Template: Mock Data**
```json
// data/mock_carrier_data.json
{
  "devices": {
    "iphone-17-pro-max": {
      "name": "iPhone 17 Pro Max",
      "storage_options": ["256GB", "512GB", "1TB"],
      "carriers": {
        "verizon": {
          "image_url": "https://via.placeholder.com/300x300?text=iPhone+17+Verizon",
          "price_upfront": 1199,
          "monthly_payment_36mo": 33.30,
          "trade_in_max": 800,
          "colors": ["Black", "Silver", "Blue", "Gold"]
        },
        "att": {
          "image_url": "https://via.placeholder.com/300x300?text=iPhone+17+ATT",
          "price_upfront": 1199,
          "monthly_payment_30mo": 40.00,
          "trade_in_max": 700,
          "colors": ["Black", "Silver", "Blue"]
        },
        "tmobile": {
          "image_url": "https://via.placeholder.com/300x300?text=iPhone+17+TMobile",
          "price_upfront": 1199,
          "monthly_payment_24mo": 50.00,
          "trade_in_max": 1000,
          "colors": ["Black", "Silver", "Magenta"]
        }
      }
    }
  }
}
```

---

### Day 2: Frontend Components

**Tasks:**
- [ ] 2.1: Create `DeviceCard.tsx` component
- [ ] 2.2: Add state management to page
- [ ] 2.3: Create `useCopilotAction` for rendering device card
- [ ] 2.4: Test with hardcoded data

**Deliverables:**
- Device card component renders with image, price, specs
- Card displays on page when button clicked
- Responsive design (mobile + desktop)

**Code Template: DeviceCard.tsx**
```typescript
// components/carrier/DeviceCard.tsx
import Image from "next/image";

type DeviceCardProps = {
  device: {
    name: string;
    carrier: string;
    image_url: string;
    price_upfront: number;
    monthly_payment: number;
    payment_months: number;
    trade_in_max: number;
    storage: string;
    colors: string[];
  };
};

export function DeviceCard({ device }: DeviceCardProps) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-shadow p-6 max-w-sm">
      {/* Carrier Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase">
          {device.carrier}
        </span>
        <span className="text-xs text-slate-500">{device.storage}</span>
      </div>

      {/* Device Image */}
      <div className="relative h-64 mb-4">
        <Image
          src={device.image_url}
          alt={device.name}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Device Name */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {device.name}
      </h3>

      {/* Pricing */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-slate-600">Upfront</span>
          <span className="text-2xl font-bold text-slate-900">
            ${device.price_upfront}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-slate-600">Monthly</span>
          <span className="text-lg font-semibold text-blue-600">
            ${device.monthly_payment}/mo
          </span>
        </div>
        <div className="text-xs text-slate-500 text-right">
          {device.payment_months} months
        </div>
      </div>

      {/* Trade-in */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600">💰</span>
          <div>
            <p className="text-xs text-green-700 font-medium">Trade-in Value</p>
            <p className="text-sm font-bold text-green-800">
              Up to ${device.trade_in_max}
            </p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="mb-4">
        <p className="text-xs text-slate-600 mb-2">Available Colors</p>
        <div className="flex gap-2">
          {device.colors.map((color) => (
            <div
              key={color}
              className="w-8 h-8 rounded-full border-2 border-slate-300"
              style={{ backgroundColor: color.toLowerCase() }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors">
        Select {device.carrier}
      </button>
    </div>
  );
}
```

**Code Template: page.tsx (Day 2)**
```typescript
// app/carrier-comparison/page.tsx
"use client";

import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { DeviceCard } from "@/components/carrier/DeviceCard";

type Device = {
  name: string;
  carrier: string;
  image_url: string;
  price_upfront: number;
  monthly_payment: number;
  payment_months: number;
  trade_in_max: number;
  storage: string;
  colors: string[];
};

function CarrierComparisonInner() {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  // Make UI state available to agent
  useCopilotReadable({
    description: "Currently displayed device information",
    value: { 
      hasDevice: !!currentDevice, 
      deviceName: currentDevice?.name,
      carrier: currentDevice?.carrier 
    },
  });

  // Action: Render device card
  useCopilotAction({
    name: "renderDeviceCard",
    description: "Display a device card with pricing, image, and trade-in info",
    parameters: [
      { name: "name", type: "string", required: true },
      { name: "carrier", type: "string", required: true },
      { name: "image_url", type: "string", required: true },
      { name: "price_upfront", type: "number", required: true },
      { name: "monthly_payment", type: "number", required: true },
      { name: "payment_months", type: "number", required: true },
      { name: "trade_in_max", type: "number", required: true },
      { name: "storage", type: "string", required: true },
      { name: "colors", type: "array", required: true },
    ],
    handler: async (args) => {
      setCurrentDevice(args as Device);
      return `Device card rendered for ${args.name} on ${args.carrier}`;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          📱 Carrier Comparison Assistant
        </h1>
        <p className="text-slate-600">
          Compare devices and plans across Verizon, AT&T, and T-Mobile
        </p>
      </header>

      {/* Quick Test Button (for development) */}
      <section className="mb-6">
        <button
          onClick={() => setCurrentDevice({
            name: "iPhone 17 Pro Max",
            carrier: "Verizon",
            image_url: "https://via.placeholder.com/300x300?text=iPhone+17",
            price_upfront: 1199,
            monthly_payment: 33.30,
            payment_months: 36,
            trade_in_max: 800,
            storage: "256GB",
            colors: ["Black", "Silver", "Blue", "Gold"]
          })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Test: Show iPhone 17
        </button>
      </section>

      {/* Device Display */}
      {currentDevice && (
        <section className="mb-8 flex justify-center">
          <DeviceCard device={currentDevice} />
        </section>
      )}

      {/* CopilotKit Chat */}
      <section className="fixed bottom-6 right-6">
        <CopilotChat
          labels={{
            title: "Carrier Assistant",
            initial: "Ask me about device pricing across carriers!",
          }}
        />
      </section>
    </div>
  );
}

export default function CarrierComparisonPage() {
  return <CarrierComparisonInner />;
}
```

---

### Day 3: Backend - Carrier Tools

**Tasks:**
- [ ] 3.1: Create `backend/tools/carrier_tools.py`
- [ ] 3.2: Implement `get_device_pricing` tool (mock data)
- [ ] 3.3: Test tool independently
- [ ] 3.4: Add error handling

**Deliverables:**
- Tool returns mock device data
- Tool can be called from Python REPL
- Handles missing device gracefully

**Code Template: carrier_tools.py**
```python
# backend/tools/carrier_tools.py
import json
from pathlib import Path
from typing import Dict, Any, Optional
from langchain_core.tools import tool

# Load mock data
MOCK_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "mock_carrier_data.json"

def load_mock_data() -> Dict[str, Any]:
    """Load mock carrier data from JSON file"""
    try:
        with open(MOCK_DATA_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: Mock data not found at {MOCK_DATA_PATH}")
        return {"devices": {}}

@tool
def get_device_pricing(device_id: str, carrier: str = "verizon") -> Dict[str, Any]:
    """
    Get device pricing information for a specific carrier.
    
    Args:
        device_id: Device identifier (e.g., "iphone-17-pro-max")
        carrier: Carrier name ("verizon", "att", or "tmobile")
    
    Returns:
        Dictionary with device pricing info including image_url, prices, trade-in value
    
    Example:
        >>> get_device_pricing("iphone-17-pro-max", "verizon")
        {
            "name": "iPhone 17 Pro Max",
            "carrier": "verizon",
            "image_url": "...",
            "price_upfront": 1199,
            "monthly_payment": 33.30,
            ...
        }
    """
    mock_data = load_mock_data()
    
    # Find device
    device = mock_data.get("devices", {}).get(device_id)
    if not device:
        return {
            "error": f"Device '{device_id}' not found",
            "available_devices": list(mock_data.get("devices", {}).keys())
        }
    
    # Get carrier data
    carrier_data = device.get("carriers", {}).get(carrier.lower())
    if not carrier_data:
        return {
            "error": f"Carrier '{carrier}' not found for device '{device_id}'",
            "available_carriers": list(device.get("carriers", {}).keys())
        }
    
    # Determine payment months based on carrier
    payment_months = {
        "verizon": 36,
        "att": 30,
        "tmobile": 24
    }.get(carrier.lower(), 36)
    
    # Construct response
    return {
        "name": device["name"],
        "carrier": carrier,
        "image_url": carrier_data["image_url"],
        "price_upfront": carrier_data["price_upfront"],
        "monthly_payment": carrier_data.get(f"monthly_payment_{payment_months}mo", 
                                           carrier_data["price_upfront"] / payment_months),
        "payment_months": payment_months,
        "trade_in_max": carrier_data["trade_in_max"],
        "storage": device["storage_options"][0],  # Default to first option
        "colors": carrier_data["colors"]
    }

@tool
def compare_device_across_carriers(device_id: str) -> Dict[str, Any]:
    """
    Compare device pricing across all carriers.
    
    Args:
        device_id: Device identifier (e.g., "iphone-17-pro-max")
    
    Returns:
        Dictionary with comparison data for all carriers
    """
    carriers = ["verizon", "att", "tmobile"]
    comparison = {}
    
    for carrier in carriers:
        result = get_device_pricing(device_id, carrier)
        if "error" not in result:
            comparison[carrier] = result
    
    return {
        "device_id": device_id,
        "carriers": comparison,
        "recommendation": _generate_recommendation(comparison)
    }

def _generate_recommendation(comparison: Dict[str, Dict]) -> str:
    """Generate recommendation based on comparison data"""
    if not comparison:
        return "No data available for comparison"
    
    # Find cheapest monthly payment
    cheapest = min(comparison.items(), 
                   key=lambda x: x[1]["monthly_payment"])
    
    # Find best trade-in
    best_trade_in = max(comparison.items(),
                        key=lambda x: x[1]["trade_in_max"])
    
    return (
        f"{cheapest[0].title()} has the lowest monthly payment "
        f"(${cheapest[1]['monthly_payment']}/mo). "
        f"{best_trade_in[0].title()} offers the best trade-in value "
        f"(up to ${best_trade_in[1]['trade_in_max']})."
    )

# Export tools
carrier_tools = [
    get_device_pricing,
    compare_device_across_carriers
]
```

---

### Day 4: Backend - Carrier Agent

**Tasks:**
- [ ] 4.1: Create `backend/agents/carrier_agent.py`
- [ ] 4.2: Register agent in `backend/main.py`
- [ ] 4.3: Update agent instructions
- [ ] 4.4: Test agent with API calls

**Deliverables:**
- Carrier agent registered at `/api/copilotkit/agents/carrier-agent`
- Agent can call carrier tools
- Agent knows to call `renderDeviceCard` action

**Code Template: carrier_agent.py**
```python
# backend/agents/carrier_agent.py
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from copilotkit import CopilotKitMiddleware
from copilotkit.langchain import copilotkit_emit_message, copilotkit_customize_config
from typing import TypedDict, List, Any
from backend.tools.carrier_tools import carrier_tools

# Agent state
class CarrierAgentState(TypedDict):
    messages: List[Any]

# Instructions
CARRIER_AGENT_INSTRUCTIONS = """
You are a helpful carrier comparison assistant for Verizon customers.

Your capabilities:
1. Get device pricing from Verizon, AT&T, and T-Mobile
2. Compare devices across carriers
3. Render device cards with images and pricing
4. Provide recommendations based on price, trade-in value, and payment plans

When a user asks about a device:
1. Call get_device_pricing() to fetch data
2. Call renderDeviceCard() to display the device card
3. Provide a friendly summary

When comparing carriers:
1. Call compare_device_across_carriers()
2. Call renderDeviceCard() for each carrier
3. Explain which carrier is best for what (price, trade-in, etc.)

Available devices:
- iphone-17-pro-max

Always call renderDeviceCard to show visual results, don't just describe them in text.
"""

def build_carrier_agent():
    """Build the carrier comparison agent"""
    
    # Create LLM with tools
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    llm_with_tools = llm.bind_tools(carrier_tools)
    
    # Define agent node
    async def agent_node(state: CarrierAgentState):
        config = copilotkit_customize_config(
            config={},
            emit_messages=True,
            emit_intermediate_state=[{
                "state_key": "current_device",
                "tool": "get_device_pricing",
                "tool_argument": "device_id"
            }]
        )
        
        # Get response from LLM
        response = await llm_with_tools.ainvoke(
            [{"role": "system", "content": CARRIER_AGENT_INSTRUCTIONS}] + state["messages"],
            config=config
        )
        
        return {"messages": [response]}
    
    # Build graph
    workflow = StateGraph(CarrierAgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)
    
    # Compile with CopilotKit middleware
    graph = workflow.compile()
    return CopilotKitMiddleware(graph=graph)

# Export
carrier_graph = build_carrier_agent()
```

**Code Template: Update main.py**
```python
# backend/main.py (add to existing file)

from backend.agents.carrier_agent import carrier_graph
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import LangGraphAGUIAgent

# ... existing code ...

# Register carrier agent
carrier_agent = LangGraphAGUIAgent(
    name="carrier-agent",
    graph=carrier_graph,
    description="Carrier comparison assistant for devices and plans"
)

# Add endpoint
add_fastapi_endpoint(
    app,
    carrier_agent,
    f"/agents/carrier-agent"
)

print("✅ Carrier agent registered at /api/copilotkit/agents/carrier-agent")
```

---

### Day 5: Integration & Testing

**Tasks:**
- [ ] 5.1: Update frontend route.ts to register carrier-agent
- [ ] 5.2: Update ClientLayoutWrapper for /carrier-comparison route
- [ ] 5.3: End-to-end testing
- [ ] 5.4: Fix any bugs
- [ ] 5.5: Demo preparation

**Deliverables:**
- Full flow works: User asks → Agent fetches data → Card renders
- Test scenarios pass
- Demo ready for stakeholders

**Code Template: Update route.ts**
```typescript
// frontend/app/api/copilotkit/route.ts (update)

const AGENT_NAMES = [
  "copilotkit-agent",
  "finance-agent",
  "hr-agent",
  "healthcare-agent",
  "wireless-agent",
  "weather-agent",
  "carrier-agent",  // 🆕 ADD THIS
];
```

**Code Template: Update ClientLayoutWrapper.tsx**
```typescript
// frontend/components/ClientLayoutWrapper.tsx (update)

const ROUTE_AGENT_MAP: Record<string, string> = {
  "/": "copilotkit-agent",
  "/finance": "finance-agent",
  "/hr": "hr-agent",
  "/healthcare": "healthcare-agent",
  "/wireless": "wireless-agent",
  "/external-api": "weather-agent",
  "/carrier-comparison": "carrier-agent",  // 🆕 ADD THIS
};
```

**Test Scenarios:**
```
Test 1: Basic Device Query
User: "Show me iPhone 17 Pro Max pricing on Verizon"
Expected: Device card renders with image, price $1,199, monthly $33.30

Test 2: Error Handling
User: "Show me Samsung Galaxy S30"
Expected: Agent says device not found, suggests available devices

Test 3: Comparison
User: "Compare iPhone 17 Pro Max across all carriers"
Expected: 3 device cards render side-by-side

Test 4: UI State
User: "What device am I looking at?"
Expected: Agent references current device using useCopilotReadable
```

---

### Phase 1 Success Criteria

✅ **Must Have:**
- [ ] Device card renders with product image
- [ ] Agent successfully fetches mock data
- [ ] useCopilotAction triggers UI update
- [ ] Error handling works
- [ ] Demo-ready for 1 device on 1 carrier

✅ **Nice to Have:**
- [ ] Multiple storage options
- [ ] Color selection UI
- [ ] Smooth animations

🚫 **Out of Scope for Phase 1:**
- Real web scraping (use mock data)
- Multiple carriers side-by-side
- Charts
- Maps

---

## 🚀 Phase 2: Multi-Carrier (Week 2)

### Goal
Expand to **3-carrier comparison** with side-by-side device cards and comparison table.

### Duration: 5 days

### Day 6: Multi-Carrier UI Components

**Tasks:**
- [ ] 6.1: Create `DeviceComparison.tsx` component
- [ ] 6.2: Create `PlanComparisonTable.tsx` component
- [ ] 6.3: Add state for multiple devices
- [ ] 6.4: Update page layout for 3-column display

**Deliverables:**
- 3 device cards display side-by-side
- Comparison table shows features across carriers
- Responsive design (stacks on mobile)

**Code Template: DeviceComparison.tsx**
```typescript
// components/carrier/DeviceComparison.tsx
import { DeviceCard } from "./DeviceCard";

type Device = {
  // ... same as before
};

type DeviceComparisonProps = {
  devices: Device[];
  title?: string;
};

export function DeviceComparison({ devices, title }: DeviceComparisonProps) {
  if (devices.length === 0) return null;

  return (
    <section className="mb-8">
      {title && (
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device, index) => (
          <DeviceCard key={index} device={device} />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Comparison</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {devices.map((device, index) => (
            <div key={index}>
              <p className="text-xs text-slate-600 mb-1">{device.carrier}</p>
              <p className="text-lg font-bold text-slate-900">
                ${device.monthly_payment}/mo
              </p>
              <p className="text-xs text-slate-500">{device.payment_months} months</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Day 7-8: Plan Comparison Logic

**Tasks:**
- [ ] 7.1: Add plan data to mock JSON
- [ ] 7.2: Create `get_plan_details` tool
- [ ] 7.3: Create `compare_plans` tool
- [ ] 7.4: Update agent instructions for plans
- [ ] 8.1: Create `PlanComparisonTable.tsx`
- [ ] 8.2: Add `renderPlanComparison` action
- [ ] 8.3: Test plan queries

**Deliverable:** Plan comparison table renders with features.

### Day 9-10: Polish & Testing

**Tasks:**
- [ ] 9.1: Add loading states
- [ ] 9.2: Add error boundaries
- [ ] 9.3: Improve agent instructions
- [ ] 9.4: Add more mock devices (Galaxy S25, Pixel 9)
- [ ] 10.1: E2E testing all scenarios
- [ ] 10.2: Performance optimization
- [ ] 10.3: Demo prep

**Test Scenarios:**
```
Test 4: Multi-Carrier Device Comparison
User: "Compare iPhone 17 across all carriers"
Expected: 3 cards show Verizon ($33/mo), AT&T ($40/mo), T-Mobile ($50/mo)

Test 5: Plan Comparison
User: "Compare unlimited plans for 4 lines"
Expected: Table shows Verizon Plus ($180), AT&T Premium ($200), T-Mobile Go5G ($200)

Test 6: Best Deal Recommendation
User: "Which carrier has the best deal for iPhone 17?"
Expected: Agent recommends Verizon (lowest monthly) or T-Mobile (best trade-in)
```

---

## 🚀 Phase 3: Charts & Advanced UI (Week 3)

### Goal
Add **interactive charts** for price trends, cost breakdowns, and feature comparisons.

### Duration: 5 days

### Day 11: Setup Chart Library

**Tasks:**
- [ ] 11.1: Install Recharts (`npm install recharts`)
- [ ] 11.2: Create chart mock data
- [ ] 11.3: Create `PriceTrendChart.tsx` component
- [ ] 11.4: Test chart rendering

**Code Template: PriceTrendChart.tsx**
```typescript
// components/carrier/PriceTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PriceTrendChartProps = {
  data: Array<{
    month: number;
    verizon: number;
    att: number;
    tmobile: number;
  }>;
};

export function PriceTrendChart({ data }: PriceTrendChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        📊 Total Cost Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Cost ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="verizon" stroke="#ee0000" strokeWidth={2} name="Verizon" />
          <Line type="monotone" dataKey="att" stroke="#0057b8" strokeWidth={2} name="AT&T" />
          <Line type="monotone" dataKey="tmobile" stroke="#e20074" strokeWidth={2} name="T-Mobile" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Day 12-13: Implement Charts

**Tasks:**
- [ ] 12.1: Create `CostBreakdownChart.tsx` (bar chart)
- [ ] 12.2: Create `calculate_cost_over_time` tool
- [ ] 12.3: Add `renderPriceTrendChart` action
- [ ] 12.4: Add `renderCostBreakdown` action
- [ ] 13.1: Update agent to call chart actions
- [ ] 13.2: Test chart queries

### Day 14-15: Polish & Interactivity

**Tasks:**
- [ ] 14.1: Add chart legends
- [ ] 14.2: Add tooltips on hover
- [ ] 14.3: Make charts responsive
- [ ] 14.4: Add export chart feature (optional)
- [ ] 15.1: Final testing
- [ ] 15.2: Demo prep

**Test Scenarios:**
```
Test 7: Price Trend Chart
User: "Show me the total cost over 24 months for all carriers"
Expected: Line chart renders showing Verizon lowest, AT&T and T-Mobile tied

Test 8: Cost Breakdown
User: "Break down the costs for Verizon iPhone 17"
Expected: Bar chart shows device cost, plan cost, taxes, total
```

---

## 🚀 Phase 4: Coverage Maps (Week 4)

### Goal
Add **interactive coverage maps** showing carrier network quality by location.

### Duration: 5 days

### Day 16: Setup Map Library

**Tasks:**
- [ ] 16.1: Install Leaflet (`npm install leaflet react-leaflet`)
- [ ] 16.2: Add CSS imports for Leaflet
- [ ] 16.3: Create `CoverageMap.tsx` component
- [ ] 16.4: Test basic map rendering

**Code Template: CoverageMap.tsx**
```typescript
// components/carrier/CoverageMap.tsx
"use client";

import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type CoverageMapProps = {
  location: { lat: number; lng: number; name: string };
  carriers: Array<{
    name: string;
    coverage_percent: number;
    avg_speed_mbps: number;
    color: string;
  }>;
};

export function CoverageMap({ location, carriers }: CoverageMapProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        🗺️ Coverage Map - {location.name}
      </h3>
      
      <div style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <MapContainer 
          center={[location.lat, location.lng]} 
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {carriers.map((carrier, index) => (
            <Circle
              key={index}
              center={[location.lat, location.lng]}
              radius={carrier.coverage_percent * 100}
              pathOptions={{ color: carrier.color, fillColor: carrier.color, fillOpacity: 0.3 }}
            >
              <Popup>
                <strong>{carrier.name}</strong><br />
                Coverage: {carrier.coverage_percent}%<br />
                Avg Speed: {carrier.avg_speed_mbps} Mbps
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 justify-center">
        {carriers.map((carrier, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: carrier.color }}
            />
            <span className="text-sm text-slate-700">{carrier.name}</span>
            <span className="text-xs text-slate-500">
              ({carrier.coverage_percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Day 17-18: Coverage Data & Tools

**Tasks:**
- [ ] 17.1: Add coverage mock data
- [ ] 17.2: Create `get_coverage_data` tool
- [ ] 17.3: Create `compare_coverage` tool
- [ ] 17.4: Add `renderCoverageMap` action
- [ ] 18.1: Update agent instructions
- [ ] 18.2: Test coverage queries

### Day 19: Real Scraper (Optional)

**Tasks:**
- [ ] 19.1: Create `backend/scrapers/verizon_scraper.py`
- [ ] 19.2: Implement Playwright scraper
- [ ] 19.3: Test scraper independently
- [ ] 19.4: Add scraper fallback logic

### Day 20: Final Polish & Demo

**Tasks:**
- [ ] 20.1: Final E2E testing
- [ ] 20.2: Performance optimization
- [ ] 20.3: Documentation updates
- [ ] 20.4: Demo preparation
- [ ] 20.5: Stakeholder presentation

**Test Scenarios:**
```
Test 9: Coverage Map
User: "Show me coverage in Montana"
Expected: Map renders with Verizon (92%), AT&T (87%), T-Mobile (78%)

Test 10: Coverage Comparison
User: "Which carrier has best coverage in rural areas?"
Expected: Agent shows map and recommends Verizon
```

---

## 🧪 Testing Strategy

### Unit Tests
```python
# tests/test_carrier_tools.py
def test_get_device_pricing():
    result = get_device_pricing("iphone-17-pro-max", "verizon")
    assert result["carrier"] == "verizon"
    assert result["price_upfront"] == 1199
    assert "image_url" in result

def test_compare_device_across_carriers():
    result = compare_device_across_carriers("iphone-17-pro-max")
    assert len(result["carriers"]) == 3
    assert "recommendation" in result
```

### Integration Tests
```typescript
// tests/carrier-comparison.test.tsx
describe('Carrier Comparison Page', () => {
  it('renders device card when agent responds', async () => {
    render(<CarrierComparisonPage />);
    // Simulate agent response
    await waitFor(() => {
      expect(screen.getByText('iPhone 17 Pro Max')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// tests/e2e/carrier-flow.spec.ts
test('full carrier comparison flow', async ({ page }) => {
  await page.goto('/carrier-comparison');
  await page.fill('[data-testid="chat-input"]', 'Compare iPhone 17 across all carriers');
  await page.click('[data-testid="send-button"]');
  
  // Expect 3 device cards
  await expect(page.locator('.device-card')).toHaveCount(3);
});
```

---

## 🚀 Deployment Plan

### Phase 1 Deployment (After Week 1)
```bash
# Frontend (Vercel)
cd frontend
vercel deploy --prod

# Backend (Railway/Render)
cd backend
git push railway main
```

### Environment Variables
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api.yourbackend.com
NEXT_PUBLIC_COPILOTKIT_PUBLIC_KEY=your_key

# backend/.env
OPENAI_API_KEY=your_openai_key
COPILOTKIT_API_KEY=your_copilotkit_key
MOCK_DATA_MODE=true  # Phase 1
MOCK_DATA_MODE=false  # Phase 2+ with real scrapers
```

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
1. ✅ Keep weather external API page working
2. ✅ Remove /carrier-comparison route
3. ✅ Unregister carrier-agent
4. ✅ Roll back to previous commit

### If Scraper Fails (Phase 2+)
1. ✅ Enable `MOCK_DATA_MODE=true`
2. ✅ Show disclaimer: "Demo mode with sample data"
3. ✅ Continue with mock data until scraper fixed

### If Charts Break (Phase 3)
1. ✅ Disable chart actions
2. ✅ Show text-based summaries instead
3. ✅ Fix chart library issues offline

---

## 📊 Success Metrics

### Phase 1 Success
- [ ] Device card renders < 2 seconds
- [ ] Agent responds correctly 90%+ of time
- [ ] Zero production errors
- [ ] Stakeholder approval for Phase 2

### Phase 2 Success
- [ ] 3-carrier comparison works
- [ ] Plan comparison table accurate
- [ ] Page load time < 3 seconds
- [ ] Mobile responsive

### Phase 3 Success
- [ ] Charts render correctly
- [ ] Interactive tooltips work
- [ ] Export feature (optional)

### Phase 4 Success
- [ ] Coverage maps display
- [ ] Location search works
- [ ] Map is interactive (zoom, pan)

### Overall MVP Success
- [ ] All 4 phases complete
- [ ] Demo-ready for stakeholders
- [ ] Production-deployed
- [ ] Documentation complete
- [ ] User feedback collected

---

## 📝 Daily Standup Template

**What did you complete yesterday?**
- [ ] Task X.Y completed
- [ ] Issue Z fixed

**What are you working on today?**
- [ ] Task X.Y+1
- [ ] Testing feature Z

**Any blockers?**
- [ ] Waiting for API access
- [ ] Library compatibility issue

---

## 📚 References

- [Vision Document](./verizon-mcp-vision.md)
- [Technical Feasibility](./technical-feasibility-mcp-copilotkit.md)
- [CopilotKit Docs](https://docs.copilotkit.ai/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Recharts Docs](https://recharts.org/)
- [Leaflet Docs](https://leafletjs.com/)

---

## ✅ Approval & Sign-off

**Plan Reviewed By:**
- [ ] Tech Lead
- [ ] Product Manager
- [ ] Stakeholder

**Approved for Implementation:** __________ (Date)

**Phase 1 Start Date:** __________ 

---

**END OF IMPLEMENTATION PLAN**

*This document will be updated as implementation progresses.*
