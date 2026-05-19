# 🚀 Quick Start: MCP Carrier Apps Testing

## Error Fixed ✅

**Issue:** `useAgent: Agent 'default' not found`  
**Root Cause:** CopilotKit component wasn't specifying which agent to use  
**Solution:** Added `agent="copilotkit-agent"` prop to CopilotKit wrapper

```typescript
<CopilotKit runtimeUrl="/api/copilotkit" agent="copilotkit-agent">
  <CarrierComparisonInner />
</CopilotKit>
```

---

## How to Test

### 1. Navigate to the Test Page

**Option A: Click Navigation Link**
- Open http://localhost:3000
- Click: `📱 MCP Carrier Apps` in the header (rightmost link)

**Option B: Direct URL**
- Visit: http://localhost:3000/carrier-comparison

### 2. Try These Test Queries

Copy and paste these into the chat on the right side:

#### Single Carrier Queries ✅
```
Show me iPhone 15 Pro on Verizon
What's the price of Samsung Galaxy S24 on AT&T?
Get me T-Mobile's iPhone 15 pricing
Show me Galaxy Z Fold 5 on Verizon
```

#### Plan Queries ✅
```
What are AT&T's unlimited plans for 2 lines?
Show me Verizon's family plans
T-Mobile prepaid plans for 1 line
What are AT&T's business plans?
```

#### Multi-Carrier Comparison ✅
```
Compare iPhone 15 Pro prices across all carriers
Which carrier has the best deal on Galaxy S24?
Show me Verizon vs AT&T vs T-Mobile for iPhone 15
Compare Samsung Galaxy S24 prices
```

---

## How Intent Routing Works

### The Flow (7 Steps)

```
1. User Input
   └─ "Show me iPhone 15 Pro on Verizon"

2. LLM Intent Classification (GPT-4)
   └─ Intent: Device Info
   └─ Carrier: Verizon
   └─ Device: iPhone 15 Pro

3. MCP Server Discovery
   └─ LLM queries all 3 MCP servers for available tools

4. Tool Selection (Automatic!)
   └─ Selects: Verizon MCP → get_device_info
   └─ Extracts: { device_slug: "iphone-15-pro", storage: "256GB" }

5. MCP Server Execution
   └─ Check cache → Web scraping → Return JSON

6. LLM Response Synthesis
   └─ Calls UI action: renderDeviceInfo(...)

7. UI Update
   └─ React state updates → Left panel renders device card
```

### Key Points

- ✅ **No manual routing** - LLM automatically picks the right MCP server
- ✅ **Multi-server support** - Can call all 3 carriers in parallel for comparisons
- ✅ **Real-time data** - Web scraping + 1-hour cache (no mock data)
- ✅ **Dynamic UI** - LLM calls React actions to render components

---

## What You'll See

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Navigation Header                                  │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   UI Rendering       │     CopilotChat             │
│   (Left Panel)       │     (Right Panel)           │
│                      │                              │
│   📱 Device Cards    │  💬 User: "Show iPhone..."  │
│   📊 Plan Tables     │                              │
│   🔍 Comparisons     │  🤖 AI: Fetching...         │
│                      │                              │
│   Live MCP data      │  💬 User: "Compare all..."  │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

### Device Card Example

When you ask "Show me iPhone 15 Pro on Verizon", you'll see:

- **Left Panel:** Verizon-branded card (red gradient 🔴)
  - Device name and storage
  - Full price and monthly price
  - Trade-in value (if available)
  - Availability status
  - "View on Verizon" link

- **Right Panel:** Chat conversation
  - Your query
  - AI thinking process
  - Response confirming data displayed

### Comparison Table Example

When you ask "Compare iPhone 15 Pro across all carriers", you'll see:

- **Left Panel:** Side-by-side table
  - 3 rows (Verizon 🔴, AT&T 🔵, T-Mobile 🟣)
  - Full price and monthly price for each
  - Trade-in values
  - 🏆 "Best Price" badge on lowest-cost carrier

---

## Understanding Tool Discovery

### How LLM Finds Tools

1. **MCP Server Registration**
   ```typescript
   // In /frontend/app/api/copilotkit/route.ts
   mcpServers: [
     { endpoint: "http://localhost:8001" }, // Verizon
     { endpoint: "http://localhost:8002" }, // AT&T
     { endpoint: "http://localhost:8003" }, // T-Mobile
   ]
   ```

2. **Tool Discovery via HTTP**
   ```bash
   # LLM calls GET / on each MCP server
   curl http://localhost:8001/
   
   # Response includes tool list:
   {
     "tools": {
       "get_device_info": {
         "description": "Get device pricing from Verizon...",
         "parameters": { ... }
       }
     }
   }
   ```

3. **Tool Selection**
   - LLM reads descriptions
   - Matches user intent to tool
   - Extracts parameters from query
   - Calls the correct MCP server endpoint

### Why It Works

**Good Tool Descriptions:**
```python
"Get device pricing and details from Verizon. Supports: 
smartphones, tablets, smartwatches, hotspots. Query by 
device name (e.g., 'iPhone 15 Pro', 'Galaxy S24') and 
optional storage capacity."
```

**Key Elements:**
- ✅ Carrier name mentioned
- ✅ Device types listed
- ✅ Examples provided
- ✅ Parameters explained

---

## Frontend Actions (UI Rendering)

### 3 Core Actions

```typescript
// 1. Device Info Card
useCopilotAction({
  name: "renderDeviceInfo",
  handler: (args) => {
    setCurrentDevice(args);
    // Left panel shows device card
  }
});

// 2. Plan Info Card
useCopilotAction({
  name: "renderPlanInfo",
  handler: (args) => {
    setCurrentPlan(args);
    // Left panel shows plan table
  }
});

// 3. Multi-Carrier Comparison
useCopilotAction({
  name: "renderCarrierComparison",
  handler: (args) => {
    setComparison(args);
    // Left panel shows comparison table
  }
});
```

### How LLM Calls Actions

After getting data from MCP server, LLM decides which action to call:

- Single device query → `renderDeviceInfo`
- Plan query → `renderPlanInfo`
- Comparison query → `renderCarrierComparison`

The action handler updates React state, triggering a re-render of the left panel.

---

## Debugging Tips

### Check MCP Servers Are Running

```bash
./scripts/devctl.sh status

# Should show:
✓ 🔴 Verizon : pid XXXXX  http://localhost:8001
✓ 🔵 AT&T    : pid XXXXX  http://localhost:8002
✓ 🟣 T-Mobile: pid XXXXX  http://localhost:8003
```

### Verify Tool Discovery

```bash
# Check each MCP server returns tool list
curl http://localhost:8001/ | python3 -m json.tool
curl http://localhost:8002/ | python3 -m json.tool
curl http://localhost:8003/ | python3 -m json.tool

# Should see "tools" object with descriptions
```

### Check Frontend Logs

```bash
./scripts/devctl.sh logs frontend

# Look for errors related to CopilotKit or agent registration
```

### Common Issues

**Issue:** "Agent 'default' not found"  
**Fix:** ✅ Already fixed - `agent="copilotkit-agent"` prop added

**Issue:** No UI rendering after query  
**Fix:** Check that MCP servers are running and responding

**Issue:** LLM doesn't call the right tool  
**Fix:** Improve tool descriptions with more examples

---

## Documentation

### Comprehensive Guides

1. **Intent Routing Deep Dive**
   - File: `/docs/MCP-INTENT-ROUTING.md`
   - Topics: End-to-end flow, examples, debugging, extending

2. **Test Prompts**
   - File: `/docs/test-prompts.md` (Section 11)
   - 18 test queries organized by category
   - UI verification checklist

3. **Service Management**
   - File: `/docs/devctl-usage.md`
   - devctl.sh commands for starting/stopping services

---

## Week 2 Status ✅

**Completed:**
- 3 MCP servers operational (Verizon, AT&T, T-Mobile)
- Intent classification working automatically
- Frontend integration with split-panel UI
- Real-time data (web scraping + cache)
- Carrier-specific branding
- Multi-carrier comparison support

**Week 3 Preview:**
- Device search (tablets, watches, hotspots)
- Device comparison tool
- Internet plans
- Bundle savings calculator

---

## Quick Reference

**Test URL:** http://localhost:3000/carrier-comparison

**Sample Query:** `Show me iPhone 15 Pro on Verizon`

**Expected Result:**
1. Right panel: Chat shows AI thinking
2. Left panel: Red Verizon card with pricing appears
3. Card shows: device name, storage, prices, trade-in, stock status

**Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Verizon MCP: http://localhost:8001
- AT&T MCP: http://localhost:8002
- T-Mobile MCP: http://localhost:8003

**Service Control:**
```bash
./scripts/devctl.sh status   # Check all services
./scripts/devctl.sh restart  # Restart everything
./scripts/devctl.sh logs     # Tail all logs
```

---

**Last Updated:** Week 2 Day 10 (May 18, 2026)  
**Status:** ✅ Fully Operational
