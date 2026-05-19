# MCP Server Data Sources

## ✅ What Gets Scraped (Live Data)
- **Devices** - iPhone, Samsung, Google phones
  - Scraped from carrier websites in real-time
  - Cached for 1 hour to reduce scraping frequency
  - Source: `scraper.py` → Verizon.com, AT&T.com, T-Mobile.com

## 📄 What Comes from Files (Static Data)
- **Plans** - Unlimited plans, prepaid plans
  - Stored in `plans_data.json`
  - Manually maintained
  - Future: Could be scraped too

- **Promotions** - Trade-in offers, new line discounts
  - Stored in `plans_data.json`
  - Manually maintained

## 🔄 Data Flow for Device Queries

```
User asks: "Show me iPhone 17 Pro on Verizon"
              ↓
AI converts to slug: "apple-iphone-17-pro"
              ↓
Backend checks cache (1-hour TTL)
              ↓
    Cache HIT?              Cache MISS?
        ↓                        ↓
   Return cached          Scrape Verizon.com
                                 ↓
                          Cache result (1 hour)
                                 ↓
                          Return fresh data
```

## ❌ What NOT to Do
- ~~Don't add device data to plans_data.json~~ (devices are scraped!)
- ~~Don't expect instant updates~~ (cache = 1 hour delay)
- ~~Don't scrape too frequently~~ (respect rate limits)

## 📝 Files Overview

| File | Purpose | Data Source |
|------|---------|-------------|
| `plans_data.json` | Plans & promotions only | Manual |
| `scraper.py` | Live device scraping | Carrier websites |
| `cache.py` | 1-hour device cache | Memory |
| `server.py` | MCP endpoints | Combines both |

---

**Key Point:** Device data flows FROM scraper TO cache TO API response.  
Plans data flows FROM file TO API response directly.
