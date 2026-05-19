# Data Acquisition Strategy: How to Get Carrier Data

**Question**: How do we get real-time pricing, device, and plan data from Verizon, AT&T, and T-Mobile websites?

**Answer**: We have 4 main approaches, each with trade-offs.

---

## 🎯 Option 1: Web Scraping (Recommended for POC)

### How It Works
Use automated browser tools (Playwright/Puppeteer) to visit carrier websites and extract data from the HTML.

### Implementation
```python
# backend/scrapers/verizon_scraper.py
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import json

async def scrape_verizon_device(device_name: str):
    """
    Scrape device pricing from verizon.com
    """
    async with async_playwright() as p:
        # Launch browser (headless mode)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to device page
        url = f"https://www.verizon.com/smartphones/{device_name.lower().replace(' ', '-')}/"
        await page.goto(url, wait_until='networkidle')
        
        # Wait for pricing to load (dynamic content)
        await page.wait_for_selector('.device-price', timeout=10000)
        
        # Extract data
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find price elements (example selectors - will vary by site)
        price_element = soup.select_one('.device-price')
        monthly_element = soup.select_one('.monthly-payment')
        image_element = soup.select_one('.device-image img')
        
        # Parse data
        data = {
            "name": device_name,
            "price_upfront": parse_price(price_element.text),
            "monthly_payment": parse_price(monthly_element.text),
            "image_url": image_element.get('src') if image_element else None,
            "scraped_at": datetime.now().isoformat()
        }
        
        await browser.close()
        return data

def parse_price(text: str) -> float:
    """Extract numeric price from text like '$1,199.99'"""
    import re
    match = re.search(r'\$?([\d,]+\.?\d*)', text)
    if match:
        return float(match.group(1).replace(',', ''))
    return 0.0
```

### Real Example: Scraping Verizon iPhone
```python
# What the scraper sees on verizon.com/smartphones/apple-iphone-15-pro/

<div class="device-price">
  <span class="price-label">From</span>
  <span class="price-value">$999.99</span>
</div>

<div class="monthly-payment">
  <span>or</span>
  <span class="monthly-value">$27.77/mo</span>
  <span class="duration">for 36 months</span>
</div>

<img class="device-image" src="https://ss7.vzw.com/is/image/VerizonWireless/iphone-15-pro-blue" />
```

### Pros ✅
- **No API needed** - Works with any public website
- **Gets real data** - Always up-to-date pricing
- **Flexible** - Can extract images, promotions, reviews, anything visible
- **Free** - No API fees

### Cons ❌
- **Fragile** - Breaks when website HTML changes
- **Slow** - Takes 2-5 seconds per page load
- **Bot detection** - Websites might block scrapers
- **Maintenance** - Requires updates when site redesigns

### Anti-Bot Mitigation
```python
# Techniques to avoid detection
async def scrape_with_stealth(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        
        # Use real user agent
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='en-US'
        )
        
        page = await context.new_page()
        
        # Add random delays (human-like behavior)
        await page.goto(url)
        await page.wait_for_timeout(random.randint(1000, 3000))
        
        # Scroll page (mimic human)
        await page.evaluate('window.scrollBy(0, 500)')
        await page.wait_for_timeout(500)
        
        # Extract data
        data = await page.evaluate('''() => {
            return {
                price: document.querySelector('.device-price')?.textContent,
                monthly: document.querySelector('.monthly-payment')?.textContent,
                image: document.querySelector('.device-image')?.src
            }
        }''')
        
        await browser.close()
        return data
```

---

## 🎯 Option 2: Official APIs (Best, But Limited Availability)

### How It Works
Use official carrier APIs if they exist and are publicly available.

### Implementation
```python
# backend/scrapers/verizon_api.py
import httpx

VERIZON_API_KEY = os.getenv("VERIZON_API_KEY")
VERIZON_API_BASE = "https://api.verizon.com/v1"

async def get_device_from_api(device_id: str):
    """
    Call official Verizon API (if available)
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VERIZON_API_BASE}/devices/{device_id}",
            headers={
                "Authorization": f"Bearer {VERIZON_API_KEY}",
                "Accept": "application/json"
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API error: {response.status_code}")

# Example response from API
{
  "device_id": "iphone-15-pro-max",
  "name": "iPhone 15 Pro Max",
  "manufacturer": "Apple",
  "price": {
    "upfront": 1199.99,
    "monthly_36mo": 33.33
  },
  "images": [
    "https://cdn.verizon.com/devices/iphone-15-pro-max-blue.jpg"
  ],
  "available_colors": ["Blue", "Black", "Natural", "White"],
  "storage_options": ["256GB", "512GB", "1TB"]
}
```

### Pros ✅
- **Reliable** - Stable API contract
- **Fast** - Returns JSON in milliseconds
- **Structured** - Clean, predictable data format
- **Official** - No legal gray area

### Cons ❌
- **Rare** - Most carriers don't offer public APIs
- **Limited** - May not include all data (e.g., promotions)
- **Requires approval** - Need API keys, partnerships
- **Costs** - May have usage fees

### Reality Check
```
Verizon Public API:     ❌ Not available (as of 2026)
AT&T Public API:        ❌ Not available
T-Mobile Public API:    ❌ Not available

(Enterprise B2B APIs exist but require contracts)
```

---

## 🎯 Option 3: Third-Party Data Providers

### How It Works
Use services that aggregate carrier data (e.g., WhistleOut, BestPhonePlans, Coverage Map APIs).

### Implementation
```python
# backend/scrapers/third_party_data.py
import httpx

WHISTLEOUT_API_KEY = os.getenv("WHISTLEOUT_API_KEY")

async def get_plan_comparison(num_lines: int):
    """
    Get plan data from third-party aggregator
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.whistleout.com/plans/compare",
            params={
                "carriers": "verizon,att,tmobile",
                "lines": num_lines,
                "type": "unlimited"
            },
            headers={"Authorization": f"Bearer {WHISTLEOUT_API_KEY}"}
        )
        
        return response.json()

# Example: OpenSignal Coverage API
async def get_coverage_data(location: str):
    """
    Get network coverage from OpenSignal
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.opensignal.com/v1/coverage",
            params={"location": location},
            headers={"X-API-Key": os.getenv("OPENSIGNAL_API_KEY")}
        )
        
        return response.json()
```

### Available Services
| Service | Data Type | API Available | Cost |
|---------|-----------|---------------|------|
| **WhistleOut** | Plans, pricing | ✅ Yes | $500-2000/mo |
| **BestPhonePlans** | Device pricing | ❌ No API | N/A |
| **OpenSignal** | Coverage maps | ✅ Yes | $1000+/mo |
| **RootMetrics** | Network speed | ✅ Yes | Enterprise only |
| **FCC Coverage** | Coverage data | ✅ Free | Free |

### Pros ✅
- **Clean data** - Pre-processed and normalized
- **Reliable** - Maintained by third party
- **Legal** - Licensed data usage
- **Multi-carrier** - All carriers in one API

### Cons ❌
- **Expensive** - $500-$5000/month
- **Delayed** - Data may be hours/days old
- **Limited control** - Can't customize what data you get
- **Dependency** - Relies on external service

---

## 🎯 Option 4: Hybrid Approach (Recommended for Production)

### How It Works
Combine multiple methods with fallback chain.

### Implementation
```python
# backend/tools/carrier_tools.py
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

async def get_device_pricing(device_id: str, carrier: str) -> Dict[str, Any]:
    """
    Get device pricing with fallback chain:
    1. Try official API (if available)
    2. Try third-party API (if subscribed)
    3. Try web scraping
    4. Fall back to cached data
    5. Return mock data (last resort)
    """
    
    # Attempt 1: Official API
    try:
        if has_official_api(carrier):
            logger.info(f"Attempting official {carrier} API")
            data = await fetch_from_official_api(device_id, carrier)
            if data:
                await cache_data(device_id, carrier, data)
                return data
    except Exception as e:
        logger.warning(f"Official API failed: {e}")
    
    # Attempt 2: Third-party API
    try:
        if has_third_party_access():
            logger.info(f"Attempting third-party API")
            data = await fetch_from_third_party(device_id, carrier)
            if data:
                await cache_data(device_id, carrier, data)
                return data
    except Exception as e:
        logger.warning(f"Third-party API failed: {e}")
    
    # Attempt 3: Web scraping
    try:
        logger.info(f"Attempting web scraping for {carrier}")
        data = await scrape_carrier_website(device_id, carrier)
        if data:
            await cache_data(device_id, carrier, data)
            return data
    except Exception as e:
        logger.error(f"Web scraping failed: {e}")
    
    # Attempt 4: Cached data
    cached = await get_cached_data(device_id, carrier)
    if cached and not is_stale(cached, max_age_hours=24):
        logger.info("Returning cached data")
        return {**cached, "data_source": "cache", "cached": True}
    
    # Attempt 5: Mock data (development/demo)
    if is_demo_mode():
        logger.info("Returning mock data (demo mode)")
        return load_mock_data(device_id, carrier)
    
    # All failed
    raise Exception(f"Could not fetch data for {device_id} on {carrier}")
```

### Caching Strategy
```python
# backend/cache/redis_cache.py
import redis
import json
from datetime import timedelta

redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

async def cache_data(device_id: str, carrier: str, data: Dict, ttl_hours: int = 1):
    """
    Cache data with TTL (Time To Live)
    """
    cache_key = f"device:{carrier}:{device_id}"
    
    cache_entry = {
        "data": data,
        "cached_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=ttl_hours)).isoformat()
    }
    
    redis_client.setex(
        cache_key,
        timedelta(hours=ttl_hours),
        json.dumps(cache_entry)
    )

async def get_cached_data(device_id: str, carrier: str) -> Optional[Dict]:
    """
    Retrieve cached data
    """
    cache_key = f"device:{carrier}:{device_id}"
    cached = redis_client.get(cache_key)
    
    if cached:
        entry = json.loads(cached)
        return entry["data"]
    
    return None
```

### Pros ✅
- **Reliable** - Multiple fallbacks
- **Fast** - Cache reduces latency
- **Flexible** - Can swap data sources
- **Cost-effective** - Only pay for APIs when needed

### Cons ❌
- **Complex** - More code to maintain
- **Testing** - Need to test all paths
- **Monitoring** - Need to track which source is used

---

## 📊 Comparison Matrix

| Method | Speed | Cost | Reliability | Freshness | Maintenance |
|--------|-------|------|-------------|-----------|-------------|
| **Web Scraping** | Slow (2-5s) | Free | Medium | Real-time | High |
| **Official API** | Fast (<1s) | Free-$$$ | High | Real-time | Low |
| **Third-party API** | Fast (<1s) | $$$$ | High | Delayed | Low |
| **Hybrid** | Medium | $-$$$ | Very High | Real-time | Medium |
| **Mock Data** | Instant | Free | N/A | Static | None |

---

## 🚀 Recommended Implementation Plan

### Phase 1 (Week 1): Mock Data Only
```python
# Use static JSON for POC
MOCK_DATA_MODE = True

def get_device_pricing(device_id, carrier):
    return load_mock_data(device_id, carrier)
```
**Why**: Prove the concept without external dependencies.

### Phase 2 (Week 2-3): Add Web Scraping
```python
# Implement scrapers for real data
MOCK_DATA_MODE = False
ENABLE_SCRAPING = True

async def get_device_pricing(device_id, carrier):
    try:
        return await scrape_carrier_website(device_id, carrier)
    except:
        return load_mock_data(device_id, carrier)  # Fallback
```
**Why**: Get real data, keep mock as fallback.

### Phase 3 (Week 4+): Add Caching & Monitoring
```python
# Production-ready with caching
async def get_device_pricing(device_id, carrier):
    # Check cache first
    cached = await get_cached_data(device_id, carrier)
    if cached:
        return cached
    
    # Scrape if not cached
    data = await scrape_carrier_website(device_id, carrier)
    
    # Cache for 1 hour
    await cache_data(device_id, carrier, data, ttl_hours=1)
    
    return data
```
**Why**: Reduce load on carrier websites, improve speed.

---

## 🛡️ Legal & Ethical Considerations

### Is Web Scraping Legal?
**Short Answer**: Yes, if done correctly.

**Best Practices**:
1. ✅ **Respect robots.txt**
   ```python
   # Check robots.txt before scraping
   from urllib.robotparser import RobotFileParser
   
   rp = RobotFileParser()
   rp.set_url("https://www.verizon.com/robots.txt")
   rp.read()
   
   if rp.can_fetch("*", "https://www.verizon.com/smartphones/"):
       # OK to scrape
   ```

2. ✅ **Rate limiting** - Don't overload servers
   ```python
   # Max 1 request per second
   await asyncio.sleep(1)
   ```

3. ✅ **User-Agent** - Identify yourself
   ```python
   headers = {
       "User-Agent": "VerizonAssistantBot/1.0 (+https://yoursite.com/bot)"
   }
   ```

4. ✅ **Cache aggressively** - Reduce requests
   ```python
   # Cache pricing for 1 hour
   TTL = 3600
   ```

5. ✅ **Terms of Service** - Read and comply
   - Some sites explicitly prohibit scraping
   - Some allow it for personal use only

### Legal Precedents
- **LinkedIn v. hiQ Labs (2019)**: Scraping public data is legal
- **Meta v. BrandTotal (2020)**: Cannot bypass technical barriers
- **Rule**: If data is publicly visible without login, generally OK

### Recommended Approach
```
✅ Scrape public pricing pages (no login required)
✅ Cache data to minimize requests
✅ Respect robots.txt
✅ Use reasonable rate limits
❌ Don't scrape user accounts/private data
❌ Don't bypass CAPTCHAs or login walls
❌ Don't sell scraped data (use for comparison only)
```

---

## 🔧 Scraper Architecture

### Multi-Carrier Scraper System
```
┌─────────────────────────────────────────┐
│         Carrier Data Manager            │
│  (Orchestrates data fetching)           │
└────────────┬────────────────────────────┘
             │
      ┌──────┴───────┬────────────┐
      │              │            │
      ▼              ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Verizon  │  │   AT&T   │  │ T-Mobile │
│ Scraper  │  │ Scraper  │  │ Scraper  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
            ┌──────┴──────┐
            │             │
            ▼             ▼
      ┌─────────┐   ┌─────────┐
      │  Cache  │   │  Mock   │
      │ (Redis) │   │  Data   │
      └─────────┘   └─────────┘
```

### Scraper Manager
```python
# backend/scrapers/manager.py
from typing import Dict, List
import asyncio

class CarrierDataManager:
    def __init__(self):
        self.scrapers = {
            "verizon": VerizonScraper(),
            "att": ATTScraper(),
            "tmobile": TMobileScraper()
        }
    
    async def get_device_all_carriers(self, device_id: str) -> Dict:
        """
        Fetch device data from all carriers in parallel
        """
        tasks = [
            self.get_device_data(device_id, carrier)
            for carrier in self.scrapers.keys()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors
        return {
            carrier: result
            for carrier, result in zip(self.scrapers.keys(), results)
            if not isinstance(result, Exception)
        }
    
    async def get_device_data(self, device_id: str, carrier: str) -> Dict:
        """
        Get device data for specific carrier with fallback
        """
        scraper = self.scrapers.get(carrier)
        if not scraper:
            raise ValueError(f"Unknown carrier: {carrier}")
        
        try:
            # Try cache first
            cached = await self.cache.get(f"{carrier}:{device_id}")
            if cached:
                return cached
            
            # Scrape
            data = await scraper.scrape_device(device_id)
            
            # Cache
            await self.cache.set(f"{carrier}:{device_id}", data, ttl=3600)
            
            return data
        except Exception as e:
            # Fallback to mock
            return self.mock_data.get(carrier, device_id)
```

---

## 📝 Summary & Recommendation

### For Phase 1 (POC):
**Use Mock Data** ✅
- Fast to implement
- No external dependencies
- Proves the concept
- Demo-ready immediately

### For Phase 2 (Beta):
**Add Web Scraping with Fallback** ✅
- Real data from carrier websites
- Mock data as backup
- Cache to reduce load
- Monitor for failures

### For Production:
**Hybrid Approach** ✅
- Web scraping as primary
- Aggressive caching (1-4 hours)
- Mock data as fallback
- Monitoring & alerts
- Consider third-party APIs for critical data (coverage maps)

### Code Structure:
```python
# Centralized data fetching
async def get_device_pricing(device_id: str, carrier: str) -> Dict:
    if MOCK_DATA_MODE:
        return load_mock_data(device_id, carrier)
    
    # Check cache
    cached = await cache.get(f"{carrier}:{device_id}")
    if cached:
        return cached
    
    # Scrape
    try:
        data = await scrape_carrier(device_id, carrier)
        await cache.set(f"{carrier}:{device_id}", data, ttl=3600)
        return data
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        return load_mock_data(device_id, carrier)  # Fallback
```

---

## ❓ FAQ

**Q: Will Verizon/AT&T block our scraper?**  
A: Possible, but unlikely if we:
- Use reasonable rate limits (1 req/sec)
- Rotate user agents
- Cache aggressively
- Identify ourselves properly

**Q: How often should we refresh data?**  
A: Depends on data type:
- Device pricing: 1 hour
- Plans: 6 hours
- Promotions: 15 minutes
- Coverage: 24 hours

**Q: What if a scraper breaks?**  
A: Fallback to cached data → mock data → show error gracefully

**Q: Is this production-ready?**  
A: For Phase 1 (mock): Yes  
A: For production (scraping): Needs monitoring, alerts, fallbacks

---

**Ready to implement?** Let me know which phase you want to start with! 🚀
