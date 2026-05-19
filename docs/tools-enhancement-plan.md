# MCP Tools Enhancement Plan - Before Frontend Integration

**Date:** Week 2 Day 9  
**Status:** Planning Phase  
**Target:** Support all device types and service categories

---

## 🎯 Current State (Basic Tools)

### What We Have Now

**2 Basic Tools:**
1. `get_device_info()` - Only smartphones
2. `get_plans()` - Only wireless unlimited plans

**Limitations:**
- ❌ Can't handle tablets, watches, hotspots
- ❌ Can't search across device categories
- ❌ No internet/fiber plans support
- ❌ No TV/streaming service plans
- ❌ No device comparison tool
- ❌ No bundle savings calculator

---

## 🚀 Enhanced Tool Set (What Customers Need)

### Customer Query Examples

**Device Queries:**
- "Show me the latest Samsung tablets"
- "Compare iPhone 15 Pro vs Galaxy S24 Ultra"
- "What smartwatches work with AT&T?"
- "I need a mobile hotspot for my RV"
- "Show me phones under $20/month"

**Service Queries:**
- "What internet speeds are available in my area?"
- "Compare AT&T Fiber 1Gbps vs 5Gbps"
- "Show me prepaid unlimited plans"
- "What's the cheapest internet + wireless bundle?"
- "Do you have streaming TV service?"

**Bundle Queries:**
- "How much do I save with 2 lines + 1Gbps internet?"
- "Bundle 4 phone lines + 500Mbps internet + DirectTV"
- "What's the family plan with internet included?"

---

## 📋 Enhanced Tool Specifications

### 1. **get_device_info** (Enhanced)

**Current:**
```python
@app.post("/tools/get_device_info")
async def get_device_info(device_slug: str, storage: str = "128GB"):
    # Only works for phones
```

**Enhanced:**
```python
@app.post("/tools/get_device_info")
async def get_device_info(
    device_slug: str,
    storage: str = "128GB",
    device_type: str = "phone"  # NEW: phone, tablet, watch, hotspot
):
    """
    Supports:
    - Smartphones (iPhone, Galaxy, Pixel, etc.)
    - Tablets (iPad, Galaxy Tab, etc.)
    - Smartwatches (Apple Watch, Galaxy Watch, etc.)
    - Hotspots (Nighthawk, Inseego, etc.)
    """
```

**Example Queries:**
```
"Show me iPhone 15 Pro" → device_type="phone"
"Show me iPad Pro" → device_type="tablet"
"Show me Apple Watch Ultra 2" → device_type="watch"
"Show me Nighthawk M6 hotspot" → device_type="hotspot"
```

---

### 2. **search_devices** (NEW)

```python
@app.post("/tools/search_devices")
async def search_devices(
    device_type: str,  # Required: phone, tablet, watch, hotspot
    brand: Optional[str] = None,  # Apple, Samsung, Google, Motorola
    max_price: Optional[float] = None,  # Monthly payment limit
    features: Optional[List[str]] = None,  # 5G, GPS, waterproof, etc.
    sort_by: str = "popular"  # popular, price_low, price_high, newest
):
    """
    Returns grid of devices matching criteria
    UI: device-grid.html (responsive grid with filters)
    """
```

**Example Queries:**
```
"Show me all Samsung tablets" 
→ device_type="tablet", brand="Samsung"

"Smartphones under $15/month"
→ device_type="phone", max_price=15

"Waterproof watches with GPS"
→ device_type="watch", features=["waterproof", "GPS"]
```

**UI Resource:** `device-grid.html`
```html
<!-- Grid layout with filter sidebar -->
<div class="device-grid">
  <aside class="filters">
    <select name="brand">...</select>
    <input type="range" name="price">
    <checkboxes name="features">
  </aside>
  <main class="grid">
    <div class="device-card">...</div>
    <div class="device-card">...</div>
    ...
  </main>
</div>
```

---

### 3. **compare_devices** (NEW)

```python
@app.post("/tools/compare_devices")
async def compare_devices(
    device_slugs: List[str],  # 2-4 devices to compare
    comparison_type: str = "specs"  # specs, pricing, features
):
    """
    Side-by-side device comparison
    UI: device-comparison.html (comparison table)
    """
```

**Example Queries:**
```
"Compare iPhone 15 Pro vs Galaxy S24 Ultra"
→ device_slugs=["iphone-15-pro", "galaxy-s24-ultra"]

"Compare top 3 5G tablets"
→ device_slugs=["ipad-pro-11", "galaxy-tab-s9", "pixel-tablet"]
```

**UI Resource:** `device-comparison.html`
```html
<!-- Side-by-side comparison table -->
<table class="comparison-table">
  <thead>
    <tr>
      <th>Feature</th>
      <th>iPhone 15 Pro</th>
      <th>Galaxy S24 Ultra</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Price</td><td>$27.77/mo</td><td>$33.33/mo</td></tr>
    <tr><td>Screen</td><td>6.1"</td><td>6.8"</td></tr>
    ...
  </tbody>
</table>
```

---

### 4. **get_plans** (Enhanced)

**Current:**
```python
@app.post("/tools/get_plans")
async def get_plans(num_lines: int = 1):
    # Only wireless unlimited plans
```

**Enhanced:**
```python
@app.post("/tools/get_plans")
async def get_plans(
    num_lines: int = 1,
    plan_type: str = "wireless",  # NEW: wireless, internet, tv, prepaid
    contract_type: str = "postpaid"  # NEW: postpaid, prepaid, no-contract
):
    """
    Supports:
    - Wireless Plans (Unlimited, Starter, Extra, Premium)
    - Internet Plans (Fiber 300, 500, 1Gbps, 2Gbps, 5Gbps)
    - TV Plans (DirecTV Stream, AT&T TV)
    - Prepaid Plans (Daily, Weekly, Monthly)
    """
```

**Example Queries:**
```
"Show me unlimited wireless plans for 2 lines"
→ plan_type="wireless", num_lines=2

"What fiber internet plans are available?"
→ plan_type="internet"

"Show me prepaid plans"
→ plan_type="wireless", contract_type="prepaid"
```

---

### 5. **get_internet_plans** (NEW)

```python
@app.post("/tools/get_internet_plans")
async def get_internet_plans(
    speed: Optional[str] = None,  # 300Mbps, 500Mbps, 1Gbps, 2Gbps, 5Gbps
    zip_code: Optional[str] = None,  # Check availability
    internet_type: str = "fiber"  # fiber, 5g-home, dsl
):
    """
    AT&T Internet plans:
    - Fiber (300Mbps - 5Gbps)
    - 5G Home Internet
    - Fixed Wireless
    """
```

**Example Queries:**
```
"What's the fastest internet AT&T offers?"
→ speed=None (returns all, sorted by speed)

"Is AT&T Fiber available in 75001?"
→ zip_code="75001", internet_type="fiber"

"Show me 5G home internet"
→ internet_type="5g-home"
```

**UI Resource:** `internet-plans.html`
```html
<div class="internet-plans">
  <div class="plan-card fiber">
    <h3>AT&T Fiber 1 Gig</h3>
    <p class="speed">1000 Mbps</p>
    <p class="price">$80/mo</p>
    <ul class="features">
      <li>No data caps</li>
      <li>Symmetrical upload/download</li>
    </ul>
  </div>
</div>
```

---

### 6. **calculate_bundle_savings** (NEW)

```python
@app.post("/tools/calculate_bundle_savings")
async def calculate_bundle_savings(
    wireless_lines: int,
    internet_speed: Optional[str] = None,  # "1Gbps", "500Mbps"
    include_tv: bool = False,
    include_home_phone: bool = False
):
    """
    Calculate savings when bundling:
    - Wireless + Internet: $10/mo discount
    - Wireless + Internet + TV: $25/mo discount
    - 4+ lines + Internet: Extra $5/mo off
    """
```

**Example Queries:**
```
"How much do I save with 2 lines + 1Gbps internet?"
→ wireless_lines=2, internet_speed="1Gbps"

"Bundle 4 lines + 500Mbps internet + TV"
→ wireless_lines=4, internet_speed="500Mbps", include_tv=True
```

**UI Resource:** `bundle-calculator.html`
```html
<div class="bundle-calculator">
  <div class="bundle-summary">
    <h3>Your Bundle</h3>
    <ul>
      <li>4 Wireless Lines: $160/mo</li>
      <li>1Gbps Internet: $80/mo</li>
      <li>DirecTV Stream: $70/mo</li>
    </ul>
    <hr>
    <p class="total">Total: $285/mo</p>
    <p class="savings">Save $25/mo (bundle discount)</p>
    <p class="final">Your Price: $260/mo</p>
  </div>
</div>
```

---

## 🗂️ Device Categories & Scraping URLs

### Smartphones
```
https://www.att.com/buy/phones/
- iphone-15-pro, iphone-15, iphone-14
- galaxy-s24-ultra, galaxy-s24, galaxy-z-fold-5
- pixel-8-pro, pixel-8
- motorola-razr-plus
```

### Tablets
```
https://www.att.com/buy/tablets/
- ipad-pro-13, ipad-air, ipad-mini
- galaxy-tab-s9-ultra, galaxy-tab-s9
- pixel-tablet
```

### Smartwatches
```
https://www.att.com/buy/wearables/
- apple-watch-series-9, apple-watch-ultra-2
- galaxy-watch-6, galaxy-watch-6-classic
```

### Hotspots
```
https://www.att.com/buy/connected-devices/
- nighthawk-m6, nighthawk-m5
- inseego-5g-mifi-m2100
```

### Internet Plans
```
https://www.att.com/internet/
- fiber-300 ($55/mo)
- fiber-500 ($65/mo)
- fiber-1000 ($80/mo)
- fiber-2000 ($110/mo)
- fiber-5000 ($180/mo)
- 5g-home-internet ($60/mo)
```

---

## 📊 Implementation Phases

### Phase 1: Core Enhancements (Day 10 - Now)

**Priority: HIGH** - Needed before frontend integration

✅ **get_device_info** - Add device_type parameter
✅ **get_plans** - Add plan_type parameter
✅ Update scraper to handle tablets, watches, hotspots
✅ Update mock_data.json with sample data for all categories

**Effort:** 2-3 hours  
**Files to modify:** 3 servers × 2 files each = 6 files

---

### Phase 2: Search & Compare (Week 3 Day 1-2)

**Priority: MEDIUM** - Nice to have for launch

⏳ **search_devices** - Full implementation
⏳ **compare_devices** - Full implementation
⏳ Create device-grid.html UI
⏳ Create device-comparison.html UI

**Effort:** 4-5 hours  
**Files to create:** 6 new tools + 6 new HTML files

---

### Phase 3: Internet & Bundles (Week 3 Day 3-5)

**Priority: MEDIUM** - Expand service offerings

⏳ **get_internet_plans** - Full implementation
⏳ **calculate_bundle_savings** - Full implementation
⏳ Scrape internet plan pricing
⏳ Create bundle calculator logic

**Effort:** 6-8 hours  
**Files to create:** 6 new tools + 6 new HTML files

---

## 🎯 Recommended Approach for Day 10

### Option 1: Start with Basic (Current Tools) ⭐ RECOMMENDED

**Why:**
- Frontend integration is the priority
- 2 tools (get_device_info, get_plans) are sufficient for POC
- Can demonstrate end-to-end flow
- Enhancements can come after frontend works

**Proceed with:**
```typescript
// app/api/copilotkit/route.ts
mcpServers: [
  { name: "verizon-mcp", url: "http://localhost:8001" },
  { name: "att-mcp", url: "http://localhost:8002" },
  { name: "tmobile-mcp", url: "http://localhost:8003" }
]

// Test queries:
"Show me iPhone 15 Pro on Verizon"
"Compare iPhone 15 Pro prices across all carriers"
"What are AT&T's unlimited plans for 2 lines?"
```

**Then enhance tools in Week 3.**

---

### Option 2: Quick Enhancement First (2-3 hours)

**Add minimal device_type support:**
1. Add `device_type` parameter to get_device_info
2. Update scraper URL routing:
   ```python
   if device_type == "phone":
       url = f"{BASE_URL}/buy/phones/{device_slug}/"
   elif device_type == "tablet":
       url = f"{BASE_URL}/buy/tablets/{device_slug}/"
   elif device_type == "watch":
       url = f"{BASE_URL}/buy/wearables/{device_slug}/"
   ```
3. Add sample tablet/watch data to mock_data.json

**Then proceed with frontend integration.**

---

## 💡 My Recommendation

**Start with Option 1** (current tools as-is):

**Reasons:**
1. ✅ **Faster to market** - Frontend integration today
2. ✅ **Prove the architecture** - MCP Apps + CopilotKit working
3. ✅ **Iterate based on usage** - See what customers actually ask
4. ✅ **Week 3 for enhancements** - Dedicated time for features

**Workflow:**
```
Day 10 (Today):
- Frontend integration with 2 basic tools
- Test: "Show me iPhone 15 Pro on AT&T"
- Test: "Compare unlimited plans across carriers"
- ✅ Working end-to-end demo

Week 3 Day 1-2:
- Add device_type support (tablets, watches, hotspots)
- Add search_devices tool

Week 3 Day 3-5:
- Add internet plans
- Add bundle calculator
- Add device comparison
```

---

## 🚀 Quick Start Decision

**Would you like to:**

**A) Proceed with frontend integration NOW** (2 basic tools)
- Fastest path to working demo
- Enhance tools in Week 3

**B) Enhance tools FIRST** (add device_type, 2-3 hours)
- Support tablets, watches, hotspots
- Then do frontend integration

**C) Full enhancement NOW** (all 6 tools, full day)
- Complete tool suite
- Frontend integration tomorrow (Day 11)

**I recommend Option A** - Let's prove the architecture works end-to-end with basic tools, then enhance based on real usage patterns. 

What would you prefer? 🎯
