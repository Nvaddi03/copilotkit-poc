# 🧠 MCP Intent Classification & Routing Guide

## Overview

This document explains how user intent is classified and routed to the correct MCP (Model Context Protocol) servers and tools, and how responses are rendered in the UI.

---

## 🔄 How It Works: End-to-End Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   User UI   │ ───> │     LLM     │ ───> │ MCP Server  │ ───> │  UI Action  │
│  (Chat)     │      │  (GPT-4)    │      │ (FastAPI)   │      │  (Render)   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
      │                     │                     │                     │
      │ "Show iPhone        │ Intent: Device      │ Web Scraping        │ renderDeviceInfo()
      │  15 Pro on          │ Carrier: Verizon    │ + Cache             │ → Display Card
      │  Verizon"           │ Tool: get_device    │ Return JSON         │
      │                     │                     │                     │
```

### Step-by-Step Breakdown

#### **1. User Input (Frontend)**
- User types: `"Show me iPhone 15 Pro on Verizon"`
- `CopilotChat` component sends message to `/api/copilotkit`

#### **2. LLM Intent Classification (Backend)**
- OpenAI GPT-4 receives the query
- **Natural Language Understanding:**
  - Intent: "Device Information"
  - Carrier: "Verizon"
  - Device: "iPhone 15 Pro"
  - Action needed: Fetch device pricing and details

#### **3. MCP Server Selection**
- CopilotRuntime has 3 registered MCP servers:
  ```typescript
  mcpServers: [
    { endpoint: "http://localhost:8001" }, // Verizon MCP
    { endpoint: "http://localhost:8002" }, // AT&T MCP
    { endpoint: "http://localhost:8003" }, // T-Mobile MCP
  ]
  ```
- LLM automatically discovers available tools from all MCP servers
- **Tool Discovery:** LLM fetches tool list from each MCP server via HTTP GET `/`
  ```json
  {
    "name": "get_device_info",
    "description": "Get device pricing and details from Verizon...",
    "parameters": { "device_slug": "...", "storage": "..." }
  }
  ```

#### **4. Tool Invocation**
- LLM calls the appropriate MCP tool:
  ```json
  {
    "tool": "get_device_info",
    "endpoint": "http://localhost:8001",
    "parameters": {
      "device_slug": "iphone-15-pro",
      "storage": "256GB"
    }
  }
  ```

#### **5. MCP Server Processing**
- Verizon MCP server receives tool call
- **Data Fetching Strategy:**
  1. Check cache (1-hour TTL)
  2. If miss → Web scraping (Playwright + BeautifulSoup)
  3. Update cache
  4. Return structured JSON

#### **6. LLM Response Synthesis**
- LLM receives MCP server response
- **Decides UI rendering strategy:**
  - For single device → Call `renderDeviceInfo` action
  - For plans → Call `renderPlanInfo` action
  - For comparison → Call `renderCarrierComparison` action

#### **7. UI Action Execution (Frontend)**
- `useCopilotAction` hook receives the call:
  ```typescript
  useCopilotAction({
    name: "renderDeviceInfo",
    handler: async (args) => {
      setCurrentDevice(args as DeviceInfo);
      return "Device card rendered";
    },
  });
  ```
- React state updates
- UI re-renders with the device card

---

## 🎯 Intent Classification Examples

### Example 1: Single Device Query

**User:** `"Show me iPhone 15 Pro on Verizon"`

**LLM Classification:**
```json
{
  "intent": "device_info",
  "carrier": "verizon",
  "device": "iPhone 15 Pro",
  "storage": null,
  "action": "render_single_device"
}
```

**Tool Selection:**
- MCP Server: `http://localhost:8001` (Verizon)
- Tool: `get_device_info`
- Parameters: `{ device_slug: "iphone-15-pro", storage: "256GB" }`

**UI Action:**
- `renderDeviceInfo()` → Display Verizon-branded card with pricing

---

### Example 2: Plan Query

**User:** `"What are AT&T's unlimited plans for 2 lines?"`

**LLM Classification:**
```json
{
  "intent": "plan_info",
  "carrier": "att",
  "num_lines": 2,
  "plan_type": "unlimited",
  "action": "render_plans"
}
```

**Tool Selection:**
- MCP Server: `http://localhost:8002` (AT&T)
- Tool: `get_plans`
- Parameters: `{ num_lines: 2, plan_type: "unlimited" }`

**UI Action:**
- `renderPlanInfo()` → Display AT&T plan card with features and pricing

---

### Example 3: Multi-Carrier Comparison

**User:** `"Compare iPhone 15 Pro prices across all carriers"`

**LLM Classification:**
```json
{
  "intent": "device_comparison",
  "device": "iPhone 15 Pro",
  "carriers": ["verizon", "att", "tmobile"],
  "action": "render_comparison"
}
```

**Tool Selection:**
- LLM makes **3 parallel calls:**
  1. Verizon MCP: `get_device_info("iphone-15-pro")`
  2. AT&T MCP: `get_device_info("iphone-15-pro")`
  3. T-Mobile MCP: `get_device_info("iphone-15-pro")`

**UI Action:**
- `renderCarrierComparison()` → Display side-by-side comparison table

---

## 🛠️ Technical Components

### 1. Frontend: CopilotKit Actions

**Location:** `/frontend/app/carrier-comparison/page.tsx`

```typescript
// Define UI actions that LLM can call
useCopilotAction({
  name: "renderDeviceInfo",
  description: "Display device pricing card",
  parameters: [
    { name: "carrier", type: "string", required: true },
    { name: "device_name", type: "string", required: true },
    { name: "price_full", type: "number", required: true },
    // ... more parameters
  ],
  handler: async (args) => {
    setCurrentDevice(args as DeviceInfo);
    return "Device card rendered";
  },
});
```

**Key Pattern:**
- `useCopilotAction` registers a callable function for the LLM
- LLM can discover these actions and call them based on intent
- Handler updates React state → UI re-renders

---

### 2. Backend: MCP Server Registration

**Location:** `/frontend/app/api/copilotkit/route.ts`

```typescript
const runtime = new CopilotRuntime({
  agents: agents as any,
  mcpServers: [
    { endpoint: "http://localhost:8001" }, // Verizon
    { endpoint: "http://localhost:8002" }, // AT&T
    { endpoint: "http://localhost:8003" }, // T-Mobile
  ]
});
```

**Key Pattern:**
- `CopilotRuntime` automatically discovers tools from all MCP servers
- Each MCP server exposes tools via HTTP GET `/` endpoint
- LLM has access to all tools from all servers

---

### 3. MCP Server: Tool Definition

**Location:** `/backend/mcp_servers/verizon_mcp/server.py`

```python
@app.get("/")
async def list_tools():
    return {
        "tools": {
            "get_device_info": {
                "description": "Get device pricing and details from Verizon. Supports: smartphones, tablets, smartwatches, hotspots.",
                "parameters": {
                    "device_slug": "Device name or slug (e.g., 'iphone-15-pro', 'galaxy-s24')",
                    "storage": "Storage capacity (e.g., '128GB', '256GB', '512GB')",
                    "device_type": "Device category: 'phone', 'tablet', 'watch', 'hotspot' (optional)"
                }
            },
            "get_plans": {
                "description": "Get Verizon service plans...",
                "parameters": { ... }
            }
        }
    }
```

**Key Pattern:**
- Tool descriptions help LLM understand when to use each tool
- Parameters guide LLM on how to extract values from user input
- Clear, detailed descriptions improve intent classification accuracy

---

## 🧪 Testing Intent Classification

### Test Page Location
**URL:** `http://localhost:3000/carrier-comparison`

**Header Navigation:**
```
Dashboard | ... | Voice | 🌤️ Weather External API | 📱 MCP Carrier Apps
                                                      ^^^^^^^^^^^^^^^^
                                                      Click here!
```

### Test Queries

#### ✅ Working Queries (Week 2 Complete)

1. **Single Device Info:**
   ```
   "Show me iPhone 15 Pro on Verizon"
   "What's the price of Samsung Galaxy S24 on AT&T?"
   "Get me T-Mobile's iPhone 15 pricing"
   ```

2. **Plan Info:**
   ```
   "What are AT&T's unlimited plans for 2 lines?"
   "Show me Verizon's family plans"
   "T-Mobile prepaid plans for 1 line"
   ```

3. **Multi-Carrier Comparison:**
   ```
   "Compare iPhone 15 Pro prices across all carriers"
   "Which carrier has the best deal on Galaxy S24?"
   "Show me Verizon vs AT&T vs T-Mobile for iPhone 15"
   ```

#### ⏳ Coming Soon (Week 3)

4. **Device Search:**
   ```
   "Show me all Samsung tablets"
   "What smartwatches does Verizon have?"
   "List all 5G hotspots on T-Mobile"
   ```

5. **Device Comparison:**
   ```
   "Compare iPad Pro vs Samsung Galaxy Tab"
   "iPhone 15 Pro vs Galaxy S24 specs and pricing"
   ```

6. **Internet Plans:**
   ```
   "What fiber speeds does AT&T offer?"
   "Show me T-Mobile 5G home internet"
   "Compare Verizon Fios plans"
   ```

7. **Bundle Savings:**
   ```
   "Bundle 2 lines + 1Gbps internet on AT&T"
   "What's the savings if I get wireless + internet from Verizon?"
   ```

---

## 🎨 UI Rendering Architecture

### Split-Panel Design

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Header                                          │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   UI Rendering Area  │       CopilotChat                   │
│   (Left Panel)       │       (Right Panel)                 │
│                      │                                      │
│   📱 Device Cards    │   💬 User: "Show iPhone 15"         │
│   📊 Plan Tables     │                                      │
│   🔍 Comparisons     │   🤖 AI: Fetching from Verizon...   │
│                      │                                      │
│   Live updates from  │   💬 User: "Compare all carriers"   │
│   MCP server data    │                                      │
│                      │   🤖 AI: Calling 3 MCP servers...   │
└──────────────────────┴──────────────────────────────────────┘
```

### Component Hierarchy

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <CarrierComparisonInner>
    {/* Left Panel */}
    <UIRenderingArea>
      {currentDevice && <DeviceCard />}
      {currentPlan && <PlanCard />}
      {comparison && <ComparisonTable />}
    </UIRenderingArea>
    
    {/* Right Panel */}
    <CopilotChat
      labels={{ initial: "Ask me about carriers..." }}
    />
  </CarrierComparisonInner>
</CopilotKit>
```

### State Management

```typescript
const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
const [comparison, setComparison] = useState<ComparisonData | null>(null);

// LLM calls action → handler updates state → UI re-renders
useCopilotAction({
  name: "renderDeviceInfo",
  handler: async (args) => {
    setCurrentDevice(args); // ← State update triggers re-render
    return "Device card rendered";
  },
});
```

---

## 🔐 How LLM Knows Which Tool to Call

### 1. Tool Description Quality

**Good Description (Current Implementation):**
```python
"description": "Get device pricing and details from Verizon. Supports: smartphones, tablets, smartwatches, hotspots. Query by device name (e.g., 'iPhone 15 Pro', 'Galaxy S24') and optional storage capacity."
```

**Why it works:**
- Lists supported device types
- Provides example device names
- Explains optional parameters
- Carrier is explicitly mentioned

### 2. Parameter Hints

```python
"parameters": {
    "device_slug": "Device name or slug (e.g., 'iphone-15-pro', 'galaxy-s24')",
    "storage": "Storage capacity (e.g., '128GB', '256GB', '512GB')",
    "device_type": "Device category: 'phone', 'tablet', 'watch', 'hotspot' (optional)"
}
```

**Why it works:**
- Examples show expected format
- Optional parameters are marked
- Enumerates valid values

### 3. Tool Naming Convention

```python
tools = {
    "get_device_info",      # Clear: fetches device details
    "get_plans",            # Clear: fetches plan details
    "search_devices",       # Clear: searches device catalog
    "compare_devices",      # Clear: compares multiple devices
    "get_internet_plans",   # Clear: fetches internet service
    "calculate_bundle_savings"  # Clear: bundle pricing
}
```

**Why it works:**
- Verb-noun pattern (`get_`, `search_`, `calculate_`)
- Self-documenting names
- Consistent naming across all MCP servers

---

## 🚀 Extending with New Intents

### Step 1: Add New Tool to MCP Server

**File:** `/backend/mcp_servers/verizon_mcp/server.py`

```python
@app.get("/")
async def list_tools():
    return {
        "tools": {
            # ...existing tools...
            "get_trade_in_value": {
                "description": "Calculate trade-in value for old device. Supports: iPhone, Samsung Galaxy, Google Pixel. Provide device model and condition.",
                "parameters": {
                    "device_model": "Old device model (e.g., 'iPhone 13 Pro', 'Galaxy S22')",
                    "condition": "Device condition: 'excellent', 'good', 'fair', 'cracked'"
                }
            }
        }
    }

@app.post("/tools/get_trade_in_value")
async def get_trade_in_value(request: TradeInRequest):
    # Implementation...
    return {
        "device": request.device_model,
        "condition": request.condition,
        "trade_in_value": 450,
        "eligible_promos": [...]
    }
```

### Step 2: Add Frontend Action

**File:** `/frontend/app/carrier-comparison/page.tsx`

```typescript
useCopilotAction({
  name: "renderTradeInValue",
  description: "Display trade-in value estimate for an old device",
  parameters: [
    { name: "device_model", type: "string", required: true },
    { name: "condition", type: "string", required: true },
    { name: "trade_in_value", type: "number", required: true },
    { name: "eligible_promos", type: "object[]", required: false },
  ],
  handler: async (args) => {
    setTradeInInfo(args as TradeInInfo);
    return `Trade-in estimate rendered for ${args.device_model}`;
  },
});
```

### Step 3: Test New Intent

**User Query:**
```
"How much is my iPhone 13 Pro worth as a trade-in?"
```

**Expected Flow:**
1. LLM identifies intent: "trade_in_value"
2. LLM calls: `get_trade_in_value("iPhone 13 Pro", "good")`
3. MCP server scrapes/caches trade-in value
4. LLM calls: `renderTradeInValue({ device_model: "...", trade_in_value: 450 })`
5. UI displays trade-in estimate card

---

## 🐛 Debugging Intent Classification

### Check MCP Server Tool Registration

```bash
# Verify tools are discoverable
curl http://localhost:8001/ | python3 -m json.tool

# Should show:
{
  "tools": {
    "get_device_info": { "description": "...", "parameters": {...} },
    "get_plans": { "description": "...", "parameters": {...} }
  }
}
```

### Check CopilotKit Runtime Logs

```bash
# Frontend logs
./scripts/devctl.sh logs frontend

# Backend logs (if using LangGraph agent)
./scripts/devctl.sh logs backend
```

### Enable Debug Mode (Optional)

**File:** `/frontend/app/api/copilotkit/route.ts`

```typescript
const runtime = new CopilotRuntime({
  agents: agents as any,
  mcpServers: [...],
  // Add debug logging
  logger: {
    level: "debug",
    handler: (level, message) => console.log(`[${level}]`, message)
  }
});
```

### Common Issues

#### Issue 1: LLM doesn't call the right tool
**Symptoms:** User asks about devices, but LLM doesn't call `get_device_info`

**Fixes:**
- Improve tool description (add more examples)
- Add carrier name to description
- Check parameter hints are clear

#### Issue 2: Tool call fails silently
**Symptoms:** LLM calls tool, but no UI update

**Fixes:**
- Check MCP server is running (`./scripts/devctl.sh status`)
- Verify tool endpoint exists (`POST /tools/get_device_info`)
- Check frontend action handler is registered (`useCopilotAction`)

#### Issue 3: UI action not triggered
**Symptoms:** MCP tool succeeds, but UI doesn't render

**Fixes:**
- Ensure action name matches between LLM call and `useCopilotAction`
- Check handler doesn't throw errors (use `try/catch`)
- Verify state update logic (`setState` called correctly)

---

## 📚 Key Takeaways

### ✅ What's Working Now (Week 2 Complete)

1. **Automatic Intent Classification**
   - LLM understands natural language queries
   - Maps intent to MCP server + tool
   - No manual routing code needed

2. **Multi-Carrier Support**
   - 3 MCP servers (Verizon, AT&T, T-Mobile)
   - LLM automatically selects correct server
   - Parallel calls for comparisons

3. **Real-Time Data**
   - Web scraping + cache (1-hour TTL)
   - No mock data fallback
   - Guaranteed fresh pricing

4. **Dynamic UI Rendering**
   - LLM calls `renderDeviceInfo`, `renderPlanInfo`, `renderCarrierComparison`
   - React state updates trigger re-renders
   - Carrier-specific branding (🔴🔵🟣)

### 🔜 Coming Soon (Week 3)

5. **Advanced Search**
   - Browse devices by category (phones, tablets, watches)
   - Filter by brand, price range
   - Tool: `search_devices`

6. **Side-by-Side Comparison**
   - Compare specs + pricing
   - Tool: `compare_devices`

7. **Internet Plans**
   - Fiber, cable, 5G home internet
   - Tool: `get_internet_plans`

8. **Bundle Savings**
   - Wireless + internet combos
   - Tool: `calculate_bundle_savings`

---

## 🎓 How to Learn More

### Explore the Code

1. **Frontend Actions:**
   - `/frontend/app/carrier-comparison/page.tsx` (lines 75-160)
   - See `useCopilotAction` definitions

2. **MCP Server Tools:**
   - `/backend/mcp_servers/verizon_mcp/server.py` (lines 79-156)
   - See tool registration and descriptions

3. **CopilotKit Runtime:**
   - `/frontend/app/api/copilotkit/route.ts` (lines 35-45)
   - See MCP server registration

### Test Different Queries

Visit: **http://localhost:3000/carrier-comparison**

Try variations:
- "Show me [device] on [carrier]"
- "What are [carrier] plans for [X] lines?"
- "Compare [device] across all carriers"
- "Which carrier has the best deal on [device]?"

### Monitor the Flow

Open browser DevTools → Network tab → Filter by "copilotkit"
- See LLM requests/responses
- See MCP tool calls
- See UI action invocations

---

## 📞 Support

**Questions about intent routing?**
- Review this guide
- Check test queries section
- Inspect MCP server tool descriptions
- Enable debug logging

**Need to add new intents?**
- Follow "Extending with New Intents" section
- Update tool descriptions
- Add frontend actions
- Test with example queries

---

**Last Updated:** Week 2 Day 10 (May 18, 2026)
**Status:** ✅ Intent Classification Fully Operational
**Next:** Week 3 - Implement Additional Tools (search, compare, internet, bundles)
