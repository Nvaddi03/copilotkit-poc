# 🔥 100% LIVE SCRAPING - NO STATIC DATA!

## What Changed?

**BEFORE:**
- ❌ Devices: Scraped live ✅
- ❌ Plans: Static file (plans_data.json) ❌

**NOW:**
- ✅ Devices: Scraped live from Verizon.com
- ✅ Plans: Scraped live from Verizon.com
- ✅ **ZERO static data files!**

## Architecture

```
User Query
    ↓
AI Agent (CopilotKit)
    ↓
MCP Server (FastAPI)
    ↓
Check Cache (1-hour TTL)
    ↓
Cache Miss? → Live Scrape → Update Cache
    ↓
Return Data + UI
```

## Files

### Scrapers
- **`scraper.py`** - Device scraper (Playwright + BeautifulSoup)
- **`plan_scraper.py`** - Plan scraper (NEW! Playwright + BeautifulSoup)
- **`cache.py`** - 1-hour TTL cache for both devices and plans

### Server
- **`server.py`** - FastAPI MCP server
  - `get_device_info` → Scrapes devices
  - `get_plans` → Scrapes plans
  - `calculate_total_cost` → Uses scraped data for both

### Deleted Files
- ~~`plans_data.json`~~ ❌ DELETED
- ~~`plans_data_minimal.json`~~ ❌ DELETED
- ~~`plans_data_old.json`~~ ❌ DELETED
- ~~`mock_data.json`~~ ❌ DELETED (renamed earlier, now gone)

## Data Sources

| Data Type | Source | Cache TTL | Fallback |
|-----------|--------|-----------|----------|
| Devices | Verizon.com (live) | 1 hour | None - scraping required |
| Plans | Verizon.com (live) | 1 hour | Minimal hardcoded (if scraping fails) |
| Promotions | Verizon.com (live) | 1 hour | Empty array |

## Why Scrape Plans?

1. **Always Current**: Plans change frequently (pricing, features, promotions)
2. **No Confusion**: No more "which file has the real data?"
3. **Consistent**: Same pattern as devices (scrape → cache → serve)
4. **Scalable**: Easy to add AT&T and T-Mobile plan scrapers

## How It Works

### Device Scraping
```python
# Check cache
device = device_cache.get(f"verizon_{device_slug}_{storage}")

# Cache miss? Scrape it
if not device:
    device = await scraper.scrape_device(device_slug, storage)
    device_cache.set(cache_key, device)
```

### Plan Scraping (NEW!)
```python
# Check cache
plan_data = plan_cache.get("verizon_plans")

# Cache miss? Scrape it
if not plan_data:
    plan_data = await plan_scraper.scrape_plans()
    plan_cache.set("verizon_plans", plan_data)
```

## Testing

**Test device scraping:**
```bash
curl -X POST http://localhost:8001/tools/get_device_info \
  -H "Content-Type: application/json" \
  -d '{"device_slug": "apple-iphone-17-pro", "storage": "256GB"}'
```

**Test plan scraping:**
```bash
curl -X POST http://localhost:8001/tools/get_plans \
  -H "Content-Type: application/json" \
  -d '{"num_lines": 2}'
```

**Check health:**
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "data_source": "🔥 100% LIVE SCRAPING - Devices AND Plans scraped from Verizon.com",
  "device_cache": {...},
  "plan_cache": {...}
}
```

## Benefits

✅ **No Static Files** - Everything scraped live  
✅ **Always Current** - Real-time pricing and features  
✅ **No Confusion** - Single source of truth (Verizon.com)  
✅ **Cached** - 1-hour TTL reduces scraping load  
✅ **Scalable** - Easy to add more carriers  
✅ **Intent-Based** - AI converts natural language to device slugs  

## Next Steps

1. ✅ Verizon devices - DONE
2. ✅ Verizon plans - DONE
3. 🔜 AT&T devices
4. 🔜 AT&T plans
5. 🔜 T-Mobile devices
6. 🔜 T-Mobile plans

---

**Result:** Pure web scraping POC with zero static confusion! 🎉
