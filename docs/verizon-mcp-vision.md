# Verizon Customer Assistant - MCP Integration Vision

## 🎯 Executive Summary

Create an intelligent, autonomous customer assistant for Verizon that can answer any customer query by dynamically fetching real-time information from multiple carrier websites (Verizon, AT&T, T-Mobile, Sprint) using **Model Context Protocol (MCP) servers** integrated with **CopilotKit**.

## 💡 The Problem

### Current State
- Customers visit Verizon website with questions about:
  - Device pricing (iPhone 17, Samsung Galaxy, etc.)
  - Plan comparisons (Unlimited vs competitors)
  - Network coverage
  - Promotions and deals
  - Trade-in values
  - International roaming
- They need to manually visit multiple carrier websites to compare
- Information is siloed across different platforms
- No real-time, AI-powered comparison available

### Customer Pain Points
1. **Time-consuming research**: Must visit AT&T, T-Mobile, Sprint websites separately
2. **Outdated information**: Static comparison charts quickly become obsolete
3. **No personalized recommendations**: Can't ask "What's best for me?"
4. **Complex pricing**: Hidden fees, promotions, bundle deals are confusing
5. **Limited comparison**: Can't easily compare 3+ carriers side-by-side

## 🚀 The Vision: Intelligent Multi-Carrier Assistant

### Example Customer Interactions

#### Scenario 1: Device Shopping
```
Customer: "I'm looking for iPhone 17 Pro Max 256GB"

Assistant (via MCP):
✓ Fetches live data from:
  - verizon.com → $1,199 upfront or $33.30/mo (36 months)
  - att.com → $1,199 upfront or $40/mo (30 months)
  - t-mobile.com → $1,199 upfront or $50/mo (24 months)
  - sprint.com → [merged with T-Mobile, redirects]

📊 Displays comparison table:
┌─────────────┬──────────┬─────────────┬──────────────┬─────────────┐
│ Carrier     │ Upfront  │ Monthly     │ Total (36mo) │ Trade-in    │
├─────────────┼──────────┼─────────────┼──────────────┼─────────────┤
│ Verizon     │ $1,199   │ $33.30      │ $1,198.80    │ Up to $800  │
│ AT&T        │ $1,199   │ $40.00      │ $1,200.00    │ Up to $700  │
│ T-Mobile    │ $1,199   │ $50.00      │ $1,200.00    │ Up to $1,000│
└─────────────┴──────────┴─────────────┴──────────────┴─────────────┘

💡 Recommendation: "Verizon offers the lowest monthly payment and competitive 
trade-in value. T-Mobile has the best trade-in deal if you have a recent iPhone."
```

#### Scenario 2: Plan Comparison
```
Customer: "Compare unlimited plans across all carriers for a family of 4"

Assistant (via MCP):
✓ Fetches current plan details from:
  - verizon.com/plans → Unlimited Welcome ($30/line × 4 = $120/mo)
  - verizon.com/plans → Unlimited Plus ($45/line × 4 = $180/mo)
  - att.com/plans → Unlimited Starter ($35/line × 4 = $140/mo)
  - att.com/plans → Unlimited Premium ($50/line × 4 = $200/mo)
  - t-mobile.com/plans → Essentials ($30/line × 4 = $120/mo)
  - t-mobile.com/plans → Go5G Plus ($50/line × 4 = $200/mo)

📊 Displays comprehensive 3-carrier comparison:
┌──────────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Feature              │ Verizon Plus    │ AT&T Premium    │ T-Mobile Go5G   │
├──────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Price (4 lines)      │ $180/mo         │ $200/mo         │ $200/mo         │
│ 5G Access            │ Ultra Wideband  │ 5G+             │ 5G UC           │
│ Hotspot Data         │ 50GB            │ 50GB            │ 50GB            │
│ Premium Data         │ Unlimited       │ Unlimited       │ 100GB           │
│ International        │ Mexico/Canada   │ Mexico/Canada   │ Mexico/Canada   │
│ Streaming Quality    │ 4K UHD          │ HD              │ HD              │
│ Perks Included       │ Disney Bundle   │ HBO Max         │ Netflix Basic   │
│ Annual Upgrade       │ No              │ No              │ Yes (Go5G Next) │
└──────────────────────┴─────────────────┴─────────────────┴─────────────────┘

💡 Recommendation: "Verizon Plus offers best value at $180/mo with Disney Bundle 
and 4K streaming. T-Mobile includes Netflix and annual device upgrades, but costs 
$20/mo more. AT&T Premium is $200/mo with HBO Max—best if you prefer HBO content."

🎯 Cost Breakdown (2-year total):
• Verizon Plus: $4,320 + Disney Bundle ($360 value)
• AT&T Premium: $4,800 + HBO Max ($360 value)
• T-Mobile Go5G: $4,800 + Netflix ($240 value) + Annual upgrade benefit
```

#### Scenario 3: Network Coverage
```
Customer: "I'm moving to rural Montana. Which carrier has the best coverage?"

Assistant (via MCP):
✓ Fetches coverage maps from:
  - verizon.com/coverage → Montana: 92% 5G coverage
  - att.com/coverage → Montana: 87% 5G coverage
  - t-mobile.com/coverage → Montana: 78% 5G coverage

✓ Scrapes customer reviews & reports:
  - opensignal.com → Verizon: Best rural coverage
  - rootmetrics.com → AT&T: 2nd place Montana

🗺️ Shows interactive map comparison
📱 Network stats for Montana:

  - Verizon: 4.8/5 stars (rural)
  - AT&T: 4.2/5 stars
  - T-Mobile: 3.9/5 stars

💡 Recommendation: "Verizon has superior rural coverage in Montana with 92% 
5G availability. Consider their Unlimited Plus plan for extended travel."
```

## 🏗️ Technical Architecture

### MCP (Model Context Protocol) Integration

#### What is MCP?
MCP is an open protocol that allows AI assistants to securely connect to external data sources and tools. Instead of hardcoding integrations, MCP servers expose:
- **Resources**: Real-time data (pricing, plans, coverage)
- **Tools**: Actions (compare plans, check coverage, calculate costs)
- **Prompts**: Guided workflows (plan selection, device trade-in)

#### Why MCP for This Use Case?
1. **No website dependency**: MCP servers can be updated independently
2. **Real-time data**: Always fetch fresh pricing/plans from carrier APIs or web scraping
3. **Extensible**: Add new carriers (Mint Mobile, Google Fi) without frontend changes
4. **Secure**: MCP protocol handles authentication and rate limiting
5. **Vendor-agnostic**: Works with any MCP-compatible server implementation

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Verizon Website                           │
│              (Customer-Facing Interface)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 CopilotKit Frontend                          │
│  • CopilotChat (conversational UI)                          │
│  • useCopilotAction (UI rendering for comparisons)          │
│  • CopilotReadable (user context: location, device, plan)   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Route (Proxy)                       │
│  • /api/copilotkit → CopilotRuntime                         │
│  • Connects to MCP servers via MCP client libraries         │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  Verizon   │ │    AT&T    │ │  T-Mobile  │ │  Coverage  │
│ MCP Server │ │ MCP Server │ │ MCP Server │ │ MCP Server │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
    ┌─────────────────┐  ┌─────────────────┐
    │  Carrier APIs   │  │  Web Scrapers   │
    │  (if available) │  │  (fallback)     │
    └─────────────────┘  └─────────────────┘
```

### MCP Server Implementations

#### 1. Verizon MCP Server
**Resources:**
- `/devices` → List all devices (phones, tablets, watches)
- `/devices/{model}` → Specific device details (iPhone 17, Galaxy S25)
- `/plans` → All available plans (Unlimited, Prepaid, Business)
- `/plans/{id}` → Specific plan details
- `/promotions` → Current deals and offers
- `/coverage/map` → Coverage map data

**Tools:**
- `get_device_price(model, storage, color)` → Returns pricing with installment options
- `compare_plans(plan_ids: list)` → Side-by-side plan comparison
- `check_coverage(address)` → Network quality at location
- `calculate_total_cost(plan, devices, months)` → Total ownership cost
- `trade_in_value(old_device, condition)` → Estimated trade-in credit
- `switch_savings(current_carrier, num_lines)` → Switching incentives
- `get_active_promotions(category, num_lines)` → Current deals filtered by line count
- `calculate_line_discount(num_lines)` → Per-line pricing for multi-line plans
- `coverage_by_lines(location, num_lines)` → Network priority based on plan/lines

**Prompts:**
- `plan_recommendation(usage_profile)` → Guided plan selection
- `device_upgrade_path(current_device)` → When to upgrade and what to get

**Data Sources:**
- Option A: Official Verizon API (if available)
- Option B: Web scraper (Playwright/Puppeteer on verizon.com)
- Option C: Hybrid (API for pricing, scraper for promotions)

#### 2. AT&T MCP Server
Same structure as Verizon MCP Server, but fetches from att.com

#### 3. T-Mobile MCP Server
Same structure, fetches from t-mobile.com

#### 4. Coverage Aggregator MCP Server
**Resources:**
- `/coverage/{carrier}/{location}` → Signal strength, speed, reliability
- `/reviews/{carrier}/{location}` → Customer reviews

**Tools:**
- `compare_coverage(location, carriers: list)` → Best carrier for area
- `speed_test_data(location)` → Historical speed test results

**Data Sources:**
- OpenSignal API
- RootMetrics reports
- FCC coverage database
- Crowdsourced speed tests

### CopilotKit Frontend Implementation

#### User Interface Components

1. **Comparison Tables**
```typescript
useCopilotAction({
  name: "renderPlanComparison",
  description: "Display side-by-side plan comparison",
  parameters: [
    { name: "plans", type: "object[]", required: true }
  ],
  handler: async ({ plans }) => {
    setComparisonData(plans);
    return "Comparison table rendered";
  }
});
```

2. **Interactive Coverage Maps**
```typescript
useCopilotAction({
  name: "showCoverageMap",
  description: "Display coverage map for specified carriers",
  parameters: [
    { name: "location", type: "string", required: true },
    { name: "carriers", type: "string[]", required: true }
  ],
  handler: async ({ location, carriers }) => {
    // Render Mapbox/Leaflet with carrier overlays
  }
});
```

3. **Device Comparison Cards**
```typescript
useCopilotAction({
  name: "renderDeviceOptions",
  description: "Show device pricing across carriers",
  parameters: [
    { name: "device", type: "string", required: true },
    { name: "carriers", type: "object[]", required: true }
  ],
  handler: async ({ device, carriers }) => {
    // Render card UI with pricing, monthly costs, trade-in values
  }
});
```

4. **Cost Calculator**
```typescript
useCopilotAction({
  name: "showCostBreakdown",
  description: "Display total cost of ownership over time",
  parameters: [
    { name: "plan", type: "object", required: true },
    { name: "devices", type: "object[]", required: true },
    { name: "months", type: "number", required: true }
  ],
  handler: async (params) => {
    // Render chart showing costs over time
  }
});
```

## 🔧 Implementation Phases

### Phase 1: Proof of Concept (2 weeks)
**Goal**: Single MCP server integration

- [ ] Set up basic MCP server for Verizon
  - Device pricing endpoint
  - Plan list endpoint
  - Simple web scraper for verizon.com
- [ ] CopilotKit frontend with one comparison action
- [ ] Demo: "Compare iPhone 17 pricing with payment options"

**Tech Stack**:
- MCP Server: Python FastAPI + BeautifulSoup/Playwright
- CopilotKit: Next.js frontend
- LangGraph agent for reasoning

### Phase 2: Multi-Carrier Support (3 weeks)
**Goal**: Compare across 3 carriers

- [ ] Build AT&T MCP server
- [ ] Build T-Mobile MCP server
- [ ] Implement plan comparison logic in agent
- [ ] Add comparison table UI components
- [ ] Demo: "Compare unlimited plans for family of 4 across all carriers"

### Phase 3: Advanced Features (4 weeks)
**Goal**: Rich comparisons with coverage, reviews, promotions

- [ ] Coverage Aggregator MCP server
- [ ] Interactive coverage map UI
- [ ] **Promotion Tracking System**
  - [ ] Dedicated Promotion MCP server
  - [ ] Real-time promotion scraping (15-min refresh)
  - [ ] Promotion eligibility checker
  - [ ] Stack-able promotion logic
  - [ ] Expiration alerts in UI
- [ ] **Line-Based Optimization**
  - [ ] Multi-line pricing calculator
  - [ ] Family plan optimizer (mixed plans per line)
  - [ ] Coverage tier comparison (Welcome vs Plus vs Premium)
  - [ ] Breakpoint analysis ("add 1 more line to save $X")
- [ ] Customer review integration
- [ ] Trade-in calculator
- [ ] Total cost of ownership calculator
- [ ] **Demo scenarios**:
  - "Best Black Friday deal for family of 5"
  - "Optimize our 6-line business plan"
  - "Compare coverage quality for Premium vs Welcome plan"

### Phase 4: Production Readiness (2 weeks)
**Goal**: Scalable, reliable, monitored

- [ ] Rate limiting and caching
- [ ] Error handling and fallbacks
- [ ] Monitoring and logging
- [ ] A/B testing framework
- [ ] Analytics (track most common queries)
- [ ] Security review

## 🎨 User Experience Flow

### Example: Complete User Journey

```
1. Customer lands on Verizon homepage
   ↓
2. Clicks "AI Shopping Assistant" chat button
   ↓
3. Types: "I want to switch from AT&T to Verizon with 3 lines. 
            We need iPhone 17 for 2 lines and Galaxy S25 for 1 line. 
            What will it cost?"
   ↓
4. Agent (via MCP):
   ✓ Fetches current AT&T plan (from user or estimate)
   ✓ Gets Verizon plan prices for 3 lines
   ✓ Gets iPhone 17 pricing (upfront + monthly)
   ✓ Gets Galaxy S25 pricing
   ✓ Calculates switching incentives
   ✓ Calculates trade-in values
   ✓ Compares total costs (current vs new)
   ↓
5. Displays rich comparison:
   • Side-by-side plan comparison table
   • Device costs with payment breakdowns
   • Switching incentive details ($500 per line)
   • Trade-in estimates (if old devices provided)
   • Monthly cost comparison chart (current vs new)
   • Total savings over 24 months
   ↓
6. Customer asks: "What about coverage? I travel to Colorado often"
   ↓
7. Agent (via MCP):
   ✓ Fetches Verizon coverage map for Colorado
   ✓ Gets AT&T coverage for comparison
   ✓ Shows network speed data
   ✓ Displays customer reviews
   ↓
8. Shows interactive map with coverage overlays
   ↓
9. Customer: "Great! How do I switch?"
   ↓
10. Agent provides guided checklist:
    • Order SIM cards
    • Backup current phone data
    • Port numbers (takes ~24 hours)
    • Activate new service
    
    [Start Order] button → Redirects to Verizon cart with 
    pre-selected plans and devices
```

## 🎁 Advanced Features: Promotions & Line Optimization

### Feature 1: Intelligent Promotion Discovery

#### Scenario: "What promotions can I stack?"
```
Customer: "I'm switching from AT&T with 4 lines. What deals can I get?"

Assistant (via Promotion MCP):
✓ Fetches active promotions
✓ Checks eligibility for customer profile
✓ Identifies stackable offers
✓ Calculates maximum savings

📊 Available Promotions:
┌─────────────────────────┬──────────┬─────────────┬───────────┐
│ Promotion               │ Value    │ Stackable?  │ Expires   │
├─────────────────────────┼──────────┼─────────────┼───────────┤
│ Switching Bonus         │ $500/line│ ✅ Yes      │ 30 days   │
│ iPhone 17 Trade-in      │ $800     │ ✅ Yes      │ 60 days   │
│ 4th Line Free           │ $45/mo   │ ✅ Yes      │ Ongoing   │
│ Disney+ Bundle          │ $180/yr  │ ✅ Yes      │ 12 months │
│ Device BOGO             │ $799     │ ❌ No*      │ 14 days   │
└─────────────────────────┴──────────┴─────────────┴───────────┘

* Device BOGO cannot be combined with trade-in offer

💰 Maximum Savings Strategy:
1. Switch all 4 lines → $2,000 switching bonus
2. Trade in 2 old iPhones → $1,600 credit
3. Get 4th line free → $540/year saved
4. Disney+ Bundle included → $180/year value

🎯 Total First-Year Savings: $4,320
Monthly Cost: $135/mo (vs $180 without promos)

⚠️ Time-Sensitive: Switching bonus expires in 30 days!
```

### Feature 2: Line-Based Cost Optimization

#### Scenario: "Should we add a 5th line?"
```
Customer: "We have 4 lines at $180/mo. Should we add my college student?"

Assistant (via Line Optimizer MCP):
✓ Calculates current per-line cost: $45/line
✓ Calculates 5-line cost: $200/mo = $40/line
✓ Analyzes student discounts
✓ Checks if student needs premium data

📊 Cost Analysis:
Current (4 lines): $180/mo
Option 1 (5 lines, all Premium): $200/mo
Option 2 (5 lines, student on Welcome): $170/mo ✅

💡 Recommendation: Add student on "Unlimited Welcome" plan
• Student gets: Unlimited data, 5G access
• Family saves: $10/mo ($120/year)
• Student discount: Additional $10/mo off with .edu email

✨ Bonus: 5-line family qualifies for:
• Free Apple Watch SE ($249 value)
• 50GB extra hotspot on Premium lines
• Priority customer support

🎓 Student-Specific Perks:
• Apple Music free for 6 months
• Microsoft 365 included
• No speed throttling on campus WiFi
```

### Feature 3: Coverage Quality by Plan Tier

#### Scenario: "Why is my data slow at the airport?"
```
Customer: "I have the Welcome plan. Why is my internet slow at crowded places?"

Assistant (via Coverage MCP):
✓ Detects customer plan: Unlimited Welcome
✓ Checks current location: Airport (high congestion)
✓ Explains network priority levels

📶 Network Priority Explained:

In high-traffic areas (airports, stadiums, concerts):
┌──────────────────┬────────────────┬───────────────┬─────────────┐
│ Your Plan        │ Data Priority  │ Expected Speed│ Cost        │
├──────────────────┼────────────────┼───────────────┼─────────────┤
│ Welcome (current)│ Lower          │ 2-5 Mbps      │ $30/line    │
│ Plus             │ 50GB premium   │ 25-50 Mbps    │ $45/line    │
│ Premium          │ Unlimited      │ 100+ Mbps     │ $55/line    │
└──────────────────┴────────────────┴───────────────┴─────────────┘

🏆 At this airport right now:
• Premium customers: Avg 120 Mbps
• Plus customers: Avg 35 Mbps
• Welcome customers: Avg 3 Mbps ← You are here

💡 Recommendation:
• If you travel often → Upgrade to Plus ($15/mo more)
• If you rarely have issues → Stay on Welcome
• If you work remotely → Premium worth it
```

### Feature 4: Promotion Eligibility Checker

#### Scenario: "Can I get the teacher discount with the switching bonus?"
```
Customer: "I'm a teacher switching from T-Mobile. Can I stack discounts?"

Assistant (via Promotion MCP):
✓ Validates teacher status (.edu email or certificate)
✓ Checks switching bonus eligibility
✓ Analyzes promotion stacking rules

✅ Eligible Promotions:
1. Teacher Discount: 15% off monthly plan
2. Switching Bonus: $500 per line
3. Device Trade-in: Up to $800

🎯 Stacking Rules:
✅ Teacher Discount + Switching Bonus = YES
✅ Teacher Discount + Trade-in = YES
✅ Switching Bonus + Trade-in = YES
❌ Teacher Discount + First Responder = NO (choose one)

💰 Your Total Savings (4 lines, 2 years):
• Teacher Discount (15%): $1,296
• Switching Bonus: $2,000
• Trade-in (2 phones): $1,600
🏆 Total: $4,896 saved!
```

### Feature 5: Family Plan Optimizer with Mixed Tiers

#### Scenario: "Not everyone needs premium - optimize our 4-line family"
```
Customer: "I work from home and travel. My spouse is in office. 
          Two teens just need texting and social media. What's optimal?"

Assistant (via Family Optimizer MCP):
✓ Analyzes usage patterns per person
✓ Matches to appropriate plan tiers
✓ Calculates savings vs all-premium approach
✓ Ensures coverage needs are met

👨‍👩‍👧‍👦 Optimized Family Plan:
┌────────────┬─────────────────┬──────────┬───────────────────────┐
│ Person     │ Plan            │ Cost     │ Why?                  │
├────────────┼─────────────────┼──────────┼───────────────────────┤
│ You        │ Premium         │ $55/line │ Work travel, hotspot  │
│ Spouse     │ Plus            │ $45/line │ Streaming, commute    │
│ Teen 1     │ Welcome         │ $30/line │ Social media only     │
│ Teen 2     │ Welcome         │ $30/line │ Gaming on WiFi        │
└────────────┴─────────────────┴──────────┴───────────────────────┘

💰 Cost Comparison:
• All Premium: $220/mo
• Optimized Mix: $160/mo
• Savings: $720/year

✅ Everyone gets what they need:
• You: 100GB hotspot for work trips
• Spouse: 50GB hotspot, HD streaming
• Teens: Unlimited data, parental controls, 480p streaming

🎯 Additional Optimization:
• Add WiFi calling for teens (free)
• Set data caps on teen lines (safety)
• Share Family Calendar (included)
• Location sharing enabled
```

## 🔍 Edge Cases & Advanced Scenarios

### Edge Case 1: Multi-Carrier Family Merge
```
Customer: "My spouse is on AT&T, I'm on Verizon. Should we merge?"
```
