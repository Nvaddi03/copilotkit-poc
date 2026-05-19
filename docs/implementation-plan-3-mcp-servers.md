# 🚀 Implementation Plan: 3 Separate MCP Servers with Web Scraping

**Architecture:** 3 Independent MCP Servers (Verizon, AT&T, T-Mobile)  
**Timeline:** 4 Weeks  
**Data Source:** Web Scraping (Playwright) + Mock Data Fallback  
**Status:** ✅ Scraping Validated - All 3 carriers accessible

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CopilotKit Frontend (Next.js)                   │
│                     http://localhost:3000                            │
│                                                                      │
│  Registers 3 MCP Servers in copilotkit/route.ts:                   │
│  • mcpServers: ["verizon-mcp", "att-mcp", "tmobile-mcp"]           │
└──────────────────┬──────────────────┬──────────────────┬────────────┘
                   │                  │                  │
                   ▼                  ▼                  ▼
     ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
     │ Verizon MCP Server  │  │  AT&T MCP Server    │  │ T-Mobile MCP Server │
     │ localhost:8001      │  │ localhost:8002      │  │ localhost:8003      │
     ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
     │ Tools:              │  │ Tools:              │  │ Tools:              │
     │ • get_device_info   │  │ • get_device_info   │  │ • get_device_info   │
     │ • get_plans         │  │ • get_plans         │  │ • get_plans         │
     │ • get_promotions    │  │ • get_promotions    │  │ • get_promotions    │
     │ • calculate_total   │  │ • calculate_total   │  │ • calculate_total   │
     │                     │  │                     │  │                     │
     │ UI Resources:       │  │ UI Resources:       │  │ UI Resources:       │
     │ /ui/device-card.html│  │ /ui/device-card.html│  │ /ui/device-card.html│
     │ /ui/plans-table.html│  │ /ui/plans-table.html│  │ /ui/plans-table.html│
     │                     │  │                     │  │                     │
     │ Scraper:            │  │ Scraper:            │  │ Scraper:            │
     │ • Playwright        │  │ • Playwright        │  │ • Playwright        │
     │ • Target: verizon   │  │ • Target: att.com   │  │ • Target: t-mobile  │
     │ • Cache: 1hr TTL    │  │ • Cache: 1hr TTL    │  │ • Cache: 1hr TTL    │
     │ • Fallback: Mock    │  │ • Fallback: Mock    │  │ • Fallback: Mock    │
     └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## 📁 Project Structure

```
copilotkit-poc/
├── backend/
│   ├── mcp_servers/
│   │   ├── verizon_mcp/
│   │   │   ├── __init__.py
│   │   │   ├── server.py              # FastAPI MCP server (port 8001)
│   │   │   ├── scraper.py             # Verizon-specific Playwright scraper
│   │   │   ├── tools.py               # MCP tools (get_device_info, etc.)
│   │   │   ├── ui_resources.py        # HTML templates for UI components
│   │   │   ├── cache.py               # In-memory cache with 1hr TTL
│   │   │   ├── mock_data.json         # Fallback data if scraping fails
│   │   │   └── public/
│   │   │       └── ui/
│   │   │           ├── device-card.html   # MCP App UI component
│   │   │           └── plans-table.html
│   │   │
│   │   ├── att_mcp/
│   │   │   ├── __init__.py
│   │   │   ├── server.py              # FastAPI MCP server (port 8002)
│   │   │   ├── scraper.py             # AT&T-specific scraper
│   │   │   ├── tools.py
│   │   │   ├── ui_resources.py
│   │   │   ├── cache.py
│   │   │   ├── mock_data.json
│   │   │   └── public/ui/...
│   │   │
│   │   └── tmobile_mcp/
│   │       ├── __init__.py
│   │       ├── server.py              # FastAPI MCP server (port 8003)
│   │       ├── scraper.py             # T-Mobile-specific scraper
│   │       ├── tools.py
│   │       ├── ui_resources.py
│   │       ├── cache.py
│   │       ├── mock_data.json
│   │       └── public/ui/...
│   │
│   └── requirements.txt               # playwright, beautifulsoup4, fastapi
│
├── frontend/
│   └── app/
│       ├── api/
│       │   └── copilotkit/
│       │       └── route.ts           # Register all 3 MCP servers
│       └── carrier-comparison/
│           └── page.tsx               # UI page for carrier comparison
│
├── test_scraping.py                   # ✅ Already validated
└── docs/
    └── implementation-plan-3-mcp-servers.md
```

---

## 🗓️ Week-by-Week Implementation Plan

### **Week 1: Single MCP Server POC (Verizon Only)**

#### **Day 1: Verizon MCP Server Foundation**
**Goal:** Get basic Verizon MCP server running with mock data

**Tasks:**
1. Create folder structure for `verizon_mcp/`
2. Create `mock_data.json` with iPhone 15 Pro data
3. Create `server.py` - Basic FastAPI MCP server
4. Create `tools.py` - Single tool: `get_device_info`
5. Test server runs on `localhost:8001`

**Files to Create:**
```python
# backend/mcp_servers/verizon_mcp/server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Verizon MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "mcp_server": "verizon",
        "version": "1.0.0",
        "tools": ["get_device_info", "get_plans"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

```json
// backend/mcp_servers/verizon_mcp/mock_data.json
{
  "devices": [
    {
      "id": "iphone-15-pro",
      "name": "iPhone 15 Pro",
      "brand": "Apple",
      "carrier": "Verizon",
      "price_full": 999,
      "price_monthly": 27.77,
      "storage_options": ["128GB", "256GB", "512GB", "1TB"],
      "colors": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
      "image_url": "https://ss7.vzw.com/is/image/VerizonWireless/apple-iphone-15-pro-titanium",
      "features": ["A17 Pro chip", "Titanium design", "Action button"],
      "specs": {
        "display": "6.1-inch Super Retina XDR",
        "camera": "48MP Main | 12MP Ultra Wide",
        "battery": "Up to 23 hours video"
      }
    }
  ],
  "plans": [
    {
      "id": "unlimited-welcome",
      "name": "Unlimited Welcome",
      "price": 65,
      "lines_1": 65,
      "lines_2": 120,
      "lines_3": 135,
      "lines_4": 140,
      "data": "Unlimited",
      "speed": "5G Nationwide",
      "hotspot": "None"
    }
  ]
}
```

**Test Command:**
```bash
cd backend/mcp_servers/verizon_mcp
python server.py
# Visit: http://localhost:8001
```

---

#### **Day 2: Verizon Web Scraper**
**Goal:** Build Playwright scraper for Verizon (based on successful test)

**Tasks:**
1. Create `scraper.py` with Playwright logic
2. Extract: device name, price, monthly payment, storage, colors, images
3. Use selectors from `test_scraping.py` results: `[data-testid*="price"]`
4. Add error handling and retry logic
5. Test scraper independently

**Code Template:**
```python
# backend/mcp_servers/verizon_mcp/scraper.py
from playwright.async_api import async_playwright, TimeoutError
from bs4 import BeautifulSoup
from typing import Dict, Optional
import asyncio

class VerizonScraper:
    """Scrapes Verizon website for device info"""
    
    BASE_URL = "https://www.verizon.com"
    
    async def scrape_device(self, device_slug: str) -> Optional[Dict]:
        """
        Scrape device details from Verizon
        
        Args:
            device_slug: e.g., "apple-iphone-15-pro"
            
        Returns:
            Device data dict or None if failed
        """
        url = f"{self.BASE_URL}/smartphones/{device_slug}/"
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
                )
                page = await context.new_page()
                
                # Navigate to device page
                response = await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                
                if response.status != 200:
                    print(f"❌ HTTP {response.status} for {url}")
                    return None
                
                # Wait for dynamic content
                await page.wait_for_timeout(2000)
                
                # Get HTML content
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract data using CSS selectors
                device_data = {
                    "name": self._extract_name(soup),
                    "price_full": self._extract_full_price(soup),
                    "price_monthly": self._extract_monthly_price(soup),
                    "storage_options": self._extract_storage(soup),
                    "colors": self._extract_colors(soup),
                    "image_url": self._extract_image(soup),
                    "carrier": "Verizon"
                }
                
                await browser.close()
                return device_data
        
        except TimeoutError:
            print(f"⏱️ Timeout scraping {url}")
            return None
        except Exception as e:
            print(f"❌ Error scraping Verizon: {e}")
            return None
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract device name"""
        # Try multiple selectors
        selectors = ['h1', '[data-testid="device-name"]', '.device-title']
        for sel in selectors:
            elem = soup.select_one(sel)
            if elem:
                return elem.get_text(strip=True)
        return "Unknown Device"
    
    def _extract_monthly_price(self, soup: BeautifulSoup) -> float:
        """Extract monthly payment price"""
        # Based on test results: [data-testid*="price"]
        price_elems = soup.select('[data-testid*="price"]')
        for elem in price_elems:
            text = elem.get_text(strip=True)
            if '/mo' in text or 'month' in text:
                # Extract numeric value
                import re
                match = re.search(r'\$?(\d+\.?\d*)', text)
                if match:
                    return float(match.group(1))
        return 0.0
    
    def _extract_full_price(self, soup: BeautifulSoup) -> float:
        """Extract full retail price"""
        price_elems = soup.select('[data-testid*="price"]')
        for elem in price_elems:
            text = elem.get_text(strip=True)
            if 'Retail' in text or 'Full Price' in text:
                import re
                match = re.search(r'\$?(\d+)', text)
                if match:
                    return float(match.group(1))
        return 999.0  # Default fallback
    
    def _extract_storage(self, soup: BeautifulSoup) -> list:
        """Extract available storage options"""
        storage_options = []
        storage_elems = soup.select('[data-testid*="storage"], [class*="storage"]')
        for elem in storage_elems:
            text = elem.get_text(strip=True)
            if 'GB' in text or 'TB' in text:
                storage_options.append(text)
        return storage_options or ["128GB", "256GB"]  # Fallback
    
    def _extract_colors(self, soup: BeautifulSoup) -> list:
        """Extract available colors"""
        colors = []
        color_elems = soup.select('[data-testid*="color"], [class*="color"]')
        for elem in color_elems:
            text = elem.get_text(strip=True)
            if text and len(text) < 30:  # Reasonable color name length
                colors.append(text)
        return colors or ["Black", "White"]  # Fallback
    
    def _extract_image(self, soup: BeautifulSoup) -> str:
        """Extract device image URL"""
        # Find images with device/phone/iphone in src
        images = soup.find_all('img', src=True)
        for img in images:
            src = img.get('src', '')
            if any(keyword in src.lower() for keyword in ['device', 'phone', 'iphone']):
                # Return full URL
                if src.startswith('http'):
                    return src
                elif src.startswith('//'):
                    return f"https:{src}"
                else:
                    return f"{self.BASE_URL}{src}"
        return "https://via.placeholder.com/300x400?text=No+Image"

# Test scraper
async def test_scraper():
    scraper = VerizonScraper()
    result = await scraper.scrape_device("apple-iphone-15-pro")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_scraper())
```

**Test Command:**
```bash
python backend/mcp_servers/verizon_mcp/scraper.py
```

---

#### **Day 3: Caching Layer + Tool Integration**
**Goal:** Add caching to avoid excessive scraping, integrate scraper with tools

**Tasks:**
1. Create `cache.py` - In-memory cache with 1-hour TTL
2. Update `tools.py` to use scraper with cache fallback
3. Add mock data as final fallback
4. Test: cache hit vs cache miss behavior

**Code Template:**
```python
# backend/mcp_servers/verizon_mcp/cache.py
from typing import Dict, Optional
from datetime import datetime, timedelta
import json

class DeviceCache:
    """Simple in-memory cache with TTL"""
    
    def __init__(self, ttl_seconds: int = 3600):  # 1 hour default
        self.cache: Dict[str, Dict] = {}
        self.timestamps: Dict[str, datetime] = {}
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def get(self, key: str) -> Optional[Dict]:
        """Get cached value if not expired"""
        if key not in self.cache:
            return None
        
        # Check if expired
        if datetime.now() - self.timestamps[key] > self.ttl:
            # Expired, remove from cache
            del self.cache[key]
            del self.timestamps[key]
            return None
        
        return self.cache[key]
    
    def set(self, key: str, value: Dict):
        """Store value in cache"""
        self.cache[key] = value
        self.timestamps[key] = datetime.now()
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.timestamps.clear()

# Global cache instance
device_cache = DeviceCache(ttl_seconds=3600)
```

```python
# backend/mcp_servers/verizon_mcp/tools.py
from typing import Dict
import json
from .scraper import VerizonScraper
from .cache import device_cache

def load_mock_data() -> Dict:
    """Load mock data as fallback"""
    with open('mock_data.json', 'r') as f:
        return json.load(f)

async def get_device_info(device_slug: str = "apple-iphone-15-pro") -> Dict:
    """
    Get device information from Verizon
    
    Priority:
    1. Check cache
    2. Try web scraping
    3. Fallback to mock data
    """
    cache_key = f"verizon_{device_slug}"
    
    # 1. Check cache
    cached = device_cache.get(cache_key)
    if cached:
        print(f"✅ Cache hit for {device_slug}")
        cached['_source'] = 'cache'
        return cached
    
    # 2. Try scraping
    scraper = VerizonScraper()
    scraped_data = await scraper.scrape_device(device_slug)
    
    if scraped_data:
        print(f"✅ Scraped {device_slug} from Verizon")
        device_cache.set(cache_key, scraped_data)
        scraped_data['_source'] = 'scraping'
        return scraped_data
    
    # 3. Fallback to mock data
    print(f"⚠️ Using mock data for {device_slug}")
    mock_data = load_mock_data()
    device = mock_data['devices'][0]  # First device
    device['_source'] = 'mock'
    return device
```

---

#### **Day 4: MCP App UI Component**
**Goal:** Create HTML UI component that renders device card in chat

**Tasks:**
1. Create `public/ui/device-card.html` - Standalone HTML component
2. Style with Tailwind/inline CSS
3. Add interactivity (storage selector)
4. Serve via FastAPI static files
5. Register as UI resource in tool

**Code Template:**
```html
<!-- backend/mcp_servers/verizon_mcp/public/ui/device-card.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verizon Device Card</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-4">
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- Carrier Header -->
        <div class="bg-red-600 text-white px-4 py-2 font-bold flex items-center justify-between">
            <span>🔴 Verizon</span>
            <span class="text-xs opacity-80" id="data-source"></span>
        </div>
        
        <!-- Device Image -->
        <div class="p-4 flex justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <img id="device-image" src="" alt="Device" class="h-64 object-contain">
        </div>
        
        <!-- Device Info -->
        <div class="p-6">
            <h2 id="device-name" class="text-2xl font-bold text-gray-800 mb-2"></h2>
            
            <!-- Pricing -->
            <div class="mb-4">
                <div class="text-3xl font-bold text-red-600 mb-1">
                    $<span id="monthly-price">0</span>/mo
                </div>
                <div class="text-sm text-gray-600">
                    or $<span id="full-price">0</span> full price
                </div>
            </div>
            
            <!-- Storage Selector -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                <div id="storage-options" class="flex gap-2 flex-wrap">
                    <!-- Dynamically populated -->
                </div>
            </div>
            
            <!-- Colors -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                <div id="color-options" class="flex gap-2">
                    <!-- Dynamically populated -->
                </div>
            </div>
            
            <!-- Action Button -->
            <button class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
                View on Verizon.com →
            </button>
        </div>
        
        <!-- Data Source Badge -->
        <div class="px-6 pb-4 text-xs text-gray-500">
            <span id="timestamp"></span>
        </div>
    </div>

    <script>
        // Get data from parent context (passed by MCP framework)
        const deviceData = window.mcpData || {
            name: "iPhone 15 Pro",
            price_monthly: 27.77,
            price_full: 999,
            storage_options: ["128GB", "256GB", "512GB"],
            colors: ["Natural Titanium", "Blue Titanium"],
            image_url: "https://via.placeholder.com/300x400",
            _source: "mock"
        };

        // Populate UI
        document.getElementById('device-name').textContent = deviceData.name;
        document.getElementById('monthly-price').textContent = deviceData.price_monthly.toFixed(2);
        document.getElementById('full-price').textContent = deviceData.price_full;
        document.getElementById('device-image').src = deviceData.image_url;
        
        // Data source badge
        const sourceText = {
            'cache': '⚡ Cached',
            'scraping': '🌐 Live Data',
            'mock': '📦 Demo Data'
        };
        document.getElementById('data-source').textContent = sourceText[deviceData._source] || '';
        document.getElementById('timestamp').textContent = `Updated: ${new Date().toLocaleString()}`;
        
        // Storage options
        const storageContainer = document.getElementById('storage-options');
        deviceData.storage_options.forEach((storage, idx) => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 border rounded-lg ${idx === 0 ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:border-red-600'}`;
            btn.textContent = storage;
            storageContainer.appendChild(btn);
        });
        
        // Color swatches
        const colorContainer = document.getElementById('color-options');
        deviceData.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer hover:border-red-600';
            swatch.title = color;
            // Simplified color mapping
            const colorMap = {
                'Natural': '#D4C5A8',
                'Blue': '#4A90E2',
                'White': '#F5F5F5',
                'Black': '#1A1A1A'
            };
            const colorKey = Object.keys(colorMap).find(k => color.includes(k));
            swatch.style.backgroundColor = colorMap[colorKey] || '#CCCCCC';
            colorContainer.appendChild(swatch);
        });
    </script>
</body>
</html>
```

**Update server.py to serve static files:**
```python
from fastapi.staticfiles import StaticFiles

# Add to server.py
app.mount("/ui", StaticFiles(directory="public/ui"), name="ui")
```

---

#### **Day 5: Test & Validate Verizon MCP**
**Goal:** End-to-end testing of Verizon MCP server

**Test Scenarios:**
1. ✅ Server starts on port 8001
2. ✅ GET `/` returns MCP server info
3. ✅ Scraper extracts Verizon data successfully
4. ✅ Cache works (first call scrapes, second call uses cache)
5. ✅ Mock data fallback works when scraping fails
6. ✅ UI component renders at `/ui/device-card.html`

**Test Commands:**
```bash
# 1. Start server
cd backend/mcp_servers/verizon_mcp
python server.py

# 2. Test endpoints (in another terminal)
curl http://localhost:8001/
curl http://localhost:8001/tools/get_device_info

# 3. Test UI component
open http://localhost:8001/ui/device-card.html
```

---

### **Week 2: Add AT&T & T-Mobile MCP Servers**

#### **Day 6-7: AT&T MCP Server**
**Goal:** Clone Verizon structure for AT&T on port 8002

**Tasks:**
1. Copy `verizon_mcp/` → `att_mcp/`
2. Update `scraper.py` for AT&T URL structure (`https://www.att.com/buy/phones/`)
3. Adjust CSS selectors based on test results (53 price indicators found)
4. Update brand color to blue (#00A8E1)
5. Create `mock_data.json` for AT&T
6. Test server on `localhost:8002`

**AT&T Scraper Adjustments:**
```python
# backend/mcp_servers/att_mcp/scraper.py
class ATTScraper:
    BASE_URL = "https://www.att.com"
    
    async def scrape_device(self, device_slug: str):
        url = f"{self.BASE_URL}/buy/phones/{device_slug}/"
        # ... similar to Verizon but with AT&T-specific selectors
```

---

#### **Day 8-9: T-Mobile MCP Server**
**Goal:** Clone structure for T-Mobile on port 8003

**Tasks:**
1. Copy `verizon_mcp/` → `tmobile_mcp/`
2. Update `scraper.py` for T-Mobile (`https://www.t-mobile.com/cell-phones`)
3. Adjust selectors (175 price indicators found - rich data!)
4. Update brand color to magenta (#E20074)
5. Create `mock_data.json` for T-Mobile
6. Test server on `localhost:8003`

---

#### **Day 10: Integrate All 3 MCP Servers with Frontend**
**Goal:** Register all 3 MCP servers in CopilotKit frontend

**Tasks:**
1. Update `/app/api/copilotkit/route.ts` to register 3 servers
2. Create `/app/carrier-comparison/page.tsx`
3. Test agent can call tools from all 3 carriers
4. Verify UI resources render correctly

**Code Template:**
```typescript
// frontend/app/api/copilotkit/route.ts
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { handleRequest } = await CopilotRuntime.create({
    remoteActions: [],
    langserve: [],
    
    // Register all 3 MCP servers
    mcpServers: [
      {
        name: "verizon-mcp",
        url: "http://localhost:8001",
        transport: "sse"
      },
      {
        name: "att-mcp",
        url: "http://localhost:8002",
        transport: "sse"
      },
      {
        name: "tmobile-mcp",
        url: "http://localhost:8003",
        transport: "sse"
      }
    ]
  });

  return handleRequest(req, new OpenAIAdapter({ openai }));
}
```

**Test Queries:**
- "Show me iPhone 15 Pro on Verizon"
- "Compare iPhone 15 Pro prices across all carriers"
- "What are AT&T's unlimited plans?"

---

### **Week 3: Advanced Features**

#### **Day 11-12: Multi-Carrier Comparison Tool**
**Goal:** Create orchestration tool that queries all 3 MCP servers

**Tasks:**
1. Create `backend/orchestrator/` - Aggregates responses from 3 servers
2. Create `compare_carriers` tool
3. Create comparison table UI component
4. Show side-by-side pricing

---

#### **Day 13-14: Plans & Promotions**
**Goal:** Add plan scraping and promotion detection

**Tasks:**
1. Extend scrapers to extract plan data
2. Create `get_plans` tool per carrier
3. Create promotions parser
4. Add plans comparison UI

---

#### **Day 15: Caching & Performance**
**Goal:** Optimize scraping performance

**Tasks:**
1. Add Redis for distributed caching (optional)
2. Implement rate limiting (1 req/sec per carrier)
3. Add retry logic with exponential backoff
4. Monitor scraper health

---

### **Week 4: Production Readiness**

#### **Day 16-17: Error Handling & Monitoring**
**Tasks:**
1. Add comprehensive error handling
2. Create health check endpoints
3. Add logging (Winston/Python logging)
4. Create alerting for scraper failures

---

#### **Day 18-19: Testing & Documentation**
**Tasks:**
1. Write unit tests for scrapers
2. Write integration tests for MCP servers
3. Create API documentation
4. Write deployment guide

---

#### **Day 20: Deployment**
**Tasks:**
1. Containerize 3 MCP servers (Docker)
2. Deploy to cloud (AWS/GCP/Azure)
3. Set up monitoring dashboard
4. Load testing

---

## 🛠️ Technology Stack

| Component | Technology | Port |
|-----------|-----------|------|
| **Verizon MCP Server** | FastAPI + Playwright | 8001 |
| **AT&T MCP Server** | FastAPI + Playwright | 8002 |
| **T-Mobile MCP Server** | FastAPI + Playwright | 8003 |
| **Frontend** | Next.js 14 + CopilotKit | 3000 |
| **Web Scraping** | Playwright + BeautifulSoup | - |
| **Caching** | In-memory (→ Redis later) | - |
| **UI Components** | HTML + Tailwind CSS | - |

---

## 📦 Dependencies

**Backend (`requirements.txt`):**
```txt
fastapi==0.115.12
uvicorn==0.34.0
playwright==1.60.0
beautifulsoup4==4.14.3
lxml==5.3.0
httpx==0.28.1
python-dotenv==1.0.0
```

**Install Playwright browsers:**
```bash
pip install playwright
playwright install chromium
```

---

## 🧪 Testing Strategy

### **1. Unit Tests (Per Carrier)**
```python
# test_verizon_scraper.py
async def test_scrape_iphone():
    scraper = VerizonScraper()
    result = await scraper.scrape_device("apple-iphone-15-pro")
    assert result is not None
    assert "price_monthly" in result
    assert result["carrier"] == "Verizon"
```

### **2. Integration Tests (MCP Servers)**
```python
# test_mcp_integration.py
def test_verizon_mcp_server():
    response = requests.get("http://localhost:8001/")
    assert response.status_code == 200
    assert "verizon" in response.json()["mcp_server"]
```

### **3. E2E Tests (Frontend)**
```typescript
// Test agent calls MCP tools
test("Agent retrieves Verizon pricing", async () => {
  const response = await chat("Show iPhone 15 Pro on Verizon");
  expect(response).toContain("$27.77/mo");
});
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           Cloud Deployment (AWS/GCP)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┴─────┐
│  │ Docker       │  │ Docker       │  │ Docker         │
│  │ Container    │  │ Container    │  │ Container      │
│  │              │  │              │  │                │
│  │ Verizon MCP  │  │ AT&T MCP     │  │ T-Mobile MCP   │
│  │ Port 8001    │  │ Port 8002    │  │ Port 8003      │
│  └──────────────┘  └──────────────┘  └────────────────┘
│         ▲                 ▲                   ▲
│         └─────────────────┴───────────────────┘
│                           │
│                  ┌────────────────┐
│                  │  Load Balancer │
│                  └────────────────┘
│                           │
│                  ┌────────────────┐
│                  │  Next.js App   │
│                  │  (Frontend)    │
│                  └────────────────┘
└─────────────────────────────────────────────────┘
```

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Scraping Success Rate** | >90% | ✅ 100% (test validated) |
| **Cache Hit Rate** | >70% | TBD |
| **Response Time (cached)** | <200ms | TBD |
| **Response Time (scraping)** | <3s | TBD |
| **Uptime per MCP Server** | >99% | TBD |
| **Scraper Failure Recovery** | <1min | TBD |

---

## 🎯 Next Immediate Steps

1. ✅ **Scraping validated** - All 3 carriers accessible
2. 🔄 **Day 1 tasks** - Start building Verizon MCP server foundation
3. ⏳ **Week 1 goal** - Single working MCP server with scraping + UI

**Ready to start Day 1?** Let me know and I'll create the initial files! 🚀
