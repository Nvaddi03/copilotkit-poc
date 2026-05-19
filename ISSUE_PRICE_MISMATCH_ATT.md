# Price Mismatch Issue - AT&T iPhone 17 Pro

## Reported Issue
**User:** AT&T showing incorrect price  
**UI Shows:** $29.99/mo | $1049 full price  
**AT&T Website Shows:** $30.56/mo | $1099.99 full price (256GB)

## Root Cause Analysis

The pricing mismatch occurs because:

1. **Live Website Data (from schema.org JSON):**
   ```json
   "price": 30.56  // monthly
   "price": 1099.99  // full price for 256GB
   ```

2. **UI Displaying:** 
   - $29.99/mo (should be $30.56)
   - $1049 (should be $1099.99)

## Possible Causes

### 1. **Cache Serving Old Data**
- Device data cached with 1-hour TTL
- Old pricing still in cache
- Solution: Clear cache with `POST /cache/clear` to AT&T server

### 2. **Scraper Not Extracting Live Prices**
- Scraper may be using fallback data
- Need to verify scraper is actually parsing prices from HTML
- Check `att_mcp/scraper.py` price extraction logic

### 3. **Storage Mismatch**
- User asked for 256GB but scraper defaulting to 128GB
- Different storage = different price
- Solution: Ensure storage parameter passed correctly

## Verification Steps

### Step 1: Check Cache
```bash
# Get cache stats
curl http://localhost:8002/cache/stats

# Clear cache to force fresh scrape
curl -X POST http://localhost:8002/cache/clear
```

### Step 2: Test Fresh Scrape
```bash
# Request iPhone 17 Pro 256GB from AT&T
curl -X POST http://localhost:8002/tools/get_device_info \
  -H "Content-Type: application/json" \
  -d '{"device_slug": "apple-iphone-17-pro", "storage": "256GB"}'
```

### Step 3: Verify Scraper Output
Check the response - should show:
- `price_monthly`: 30.56 (not 29.99)
- `price_full`: 1099.99 (not 1049)
- `_source`: "scraping" (not "cache")

## Solutions

### Solution 1: Clear Cache (Quick Fix)
```bash
curl -X POST http://localhost:8002/cache/clear
```
Then ask AI again: "Show me iPhone 17 Pro 256GB on AT&T"

### Solution 2: Verify Scraper Logic
Check `backend/mcp_servers/att_mcp/scraper.py`:
- Line ~100-150: Price extraction logic
- Ensure it's parsing schema.org JSON or visible prices
- Verify storage-specific pricing is captured

### Solution 3: Check Device Slug
Ensure device slug is correct:
- Should be: `apple-iphone-17-pro` ✅
- AT&T URL: `https://www.att.com/buy/phones/apple-iphone-17-pro.html` ✅

## Expected Behavior

When working correctly:
1. User asks: "Show me iPhone 17 Pro 256GB on AT&T"
2. AI calls: `get_device_info("apple-iphone-17-pro", "256GB")`
3. Server checks cache → Miss or expired
4. Scraper fetches live data from AT&T.com
5. Returns: $30.56/mo, $1099.99 full
6. UI displays correct pricing

## Testing

```bash
# 1. Clear all caches
curl -X POST http://localhost:8001/cache/clear  # Verizon
curl -X POST http://localhost:8002/cache/clear  # AT&T
curl -X POST http://localhost:8003/cache/clear  # T-Mobile

# 2. Test AT&T scraping
curl -X POST http://localhost:8002/tools/get_device_info \
  -H "Content-Type: application/json" \
  -d '{"device_slug": "apple-iphone-17-pro", "storage": "256GB"}' \
  | jq '.data | {price_monthly, price_full, storage, _source}'

# Expected output:
{
  "price_monthly": 30.56,
  "price_full": 1099.99,
  "storage": "256GB",
  "_source": "scraping"
}
```

## Next Steps

1. ✅ Clear cache to force fresh scrape
2. ✅ Verify scraper extracts correct prices
3. ✅ Ensure storage parameter respected
4. ✅ Test with fresh AI query

## Status: **NEEDS INVESTIGATION**

The scrapers are working but either:
- Cache is serving old data, OR
- Scraper fallback logic is being used, OR  
- Storage parameter not being passed correctly

**Recommendation:** Clear cache and test fresh scraping to verify live data retrieval.
