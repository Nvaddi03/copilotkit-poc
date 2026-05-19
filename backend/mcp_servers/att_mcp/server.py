"""
AT&T MCP Server
===============

FastAPI-based Model Context Protocol server for AT&T.
Exposes tools with UI resources for device comparison.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import json
import os
import uvicorn

from scraper import ATTScraper
from plan_scraper import PlanScraper
from cache import device_cache, Cache

# Initialize plan cache
plan_cache = Cache(ttl=3600)  # 1 hour TTL for plans

app = FastAPI(
    title="AT&T MCP Server",
    description="Model Context Protocol server for AT&T carrier data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/ui", StaticFiles(directory="public/ui"), name="ui")

# Initialize scrapers for live data (NO MORE STATIC FILES!)
scraper = ATTScraper()  # For devices
plan_scraper = PlanScraper()  # For plans

@app.get("/")
def root():
    cache_stats = device_cache.get_stats()
    return {
        "mcp_server": "att",
        "carrier": "AT&T",
        "version": "1.0.0",
        "status": "operational",
        "cache": cache_stats,
        "tools": [
            {
                "name": "get_device_info",
                "description": "Get device pricing and details from AT&T. Supports: smartphones, tablets, smartwatches, hotspots. Query by device name (e.g., 'iPhone 15 Pro', 'Galaxy Tab S9', 'Apple Watch Series 9', 'Nighthawk M6').",
                "parameters": {
                    "device_slug": "Device name or slug (e.g., 'iphone-15-pro', 'galaxy-tab-s9')",
                    "storage": "Storage capacity (e.g., '128GB', '256GB', '512GB', '1TB')",
                    "device_type": "Device category: 'phone', 'tablet', 'watch', 'hotspot' (optional)"
                },
                "ui_resource": "http://localhost:8002/ui/device-card.html"
            },
            {
                "name": "get_plans",
                "description": "Get AT&T service plans. Supports: wireless/mobile plans (unlimited data, prepaid), internet plans (fiber, 5G home), TV plans. Query by service type.",
                "parameters": {
                    "num_lines": "Number of lines (for wireless plans)",
                    "plan_type": "Plan category: 'wireless', 'internet', 'tv', 'prepaid' (optional)"
                },
                "ui_resource": "http://localhost:8002/ui/plans-table.html"
            },
            {
                "name": "search_devices",
                "description": "Search for devices by category, brand, or features. Example queries: 'show me all Samsung phones', 'tablets under $500', 'smartwatches with GPS'.",
                "parameters": {
                    "device_type": "Category: 'phone', 'tablet', 'watch', 'hotspot', 'accessory'",
                    "brand": "Brand filter: 'Apple', 'Samsung', 'Google', 'Motorola' (optional)",
                    "max_price": "Maximum monthly price (optional)",
                    "features": "Required features (optional)"
                },
                "ui_resource": "http://localhost:8002/ui/device-grid.html"
            },
            {
                "name": "compare_devices",
                "description": "Compare multiple devices side-by-side. Example: 'compare iPhone 15 Pro vs Galaxy S24 Ultra'.",
                "parameters": {
                    "device_slugs": "Array of device slugs to compare (2-4 devices)"
                },
                "ui_resource": "http://localhost:8002/ui/device-comparison.html"
            },
            {
                "name": "get_internet_plans",
                "description": "Get AT&T internet plans (fiber, 5G home internet). Query by speed or address availability.",
                "parameters": {
                    "speed": "Desired speed: '300Mbps', '500Mbps', '1Gbps', '2Gbps', '5Gbps' (optional)",
                    "zip_code": "ZIP code for availability check (optional)"
                },
                "ui_resource": "http://localhost:8002/ui/internet-plans.html"
            },
            {
                "name": "calculate_bundle_savings",
                "description": "Calculate savings when bundling wireless + internet + TV. Example: '2 phone lines + 1Gbps internet'.",
                "parameters": {
                    "wireless_lines": "Number of phone lines",
                    "internet_speed": "Internet plan speed",
                    "include_tv": "Include TV service (boolean)"
                },
                "ui_resource": "http://localhost:8002/ui/bundle-calculator.html"
            }
        ],
        "data_source": "scraping + cache (no fallback)",
        "endpoints": {
            "tools": "/tools",
            "ui_resources": "/ui/*",
            "cache_stats": "/cache/stats"
        }
    }

class DeviceRequest(BaseModel):
    device_slug: str = "iphone-15-pro"
    storage: Optional[str] = "128GB"

@app.post("/tools/get_device_info")
async def get_device_info(request: DeviceRequest) -> Dict:
    cache_key = f"att_{request.device_slug}_{request.storage}"
    
    # Check cache
    cached_device = device_cache.get(cache_key)
    if cached_device:
        print(f"✅ Cache hit: {request.device_slug}")
        cached_device["selected_storage"] = request.storage
        cached_device["_source"] = "cache"
        return {
            "tool": "get_device_info",
            "carrier": "AT&T",
            "data": cached_device,
            "ui_resource": "http://localhost:8002/ui/device-card.html",
            "ui_data": cached_device
        }
    
    # Try scraping
    print(f"🌐 Scraping: {request.device_slug}")
    scraped_device = await scraper.scrape_device(request.device_slug, request.storage)
    
    if scraped_device:
        device_cache.set(cache_key, scraped_device)
        scraped_device["selected_storage"] = request.storage
        return {
            "tool": "get_device_info",
            "carrier": "AT&T",
            "data": scraped_device,
            "ui_resource": "http://localhost:8002/ui/device-card.html",
            "ui_data": scraped_device
        }
    
    # No fallback - scraping failed
    print(f"❌ Scraping failed for: {request.device_slug}")
    raise HTTPException(
        status_code=503, 
        detail=f"Unable to fetch device data for {request.device_slug}. Scraping failed and no cached data available."
    )

class PlansRequest(BaseModel):
    num_lines: int = 1

@app.post("/tools/get_plans")
async def get_plans(request: PlansRequest) -> Dict:
    """Get AT&T plans - SCRAPED LIVE from ATT.com"""
    # Check cache first
    cache_key = "att_plans"
    cached_data = plan_cache.get(cache_key)
    
    if cached_data:
        plan_data = cached_data
    else:
        # Scrape live plans from AT&T.com
        plan_data = await plan_scraper.scrape_plans()
        # Cache for 1 hour
        plan_cache.set(cache_key, plan_data)
    
    plans = []
    for plan in plan_data["plans"]:
        plan_copy = plan.copy()
        price_key = str(min(request.num_lines, 5))
        plan_copy["price"] = plan["price_per_line"].get(price_key, plan["price_per_line"]["1"])
        plan_copy["lines"] = request.num_lines
        plans.append(plan_copy)
    
    return {
        "tool": "get_plans",
        "carrier": "AT&T",
        "data": {"plans": plans, "lines": request.num_lines},
        "ui_resource": "http://localhost:8002/ui/plans-table.html",
        "ui_data": {"plans": plans, "lines": request.num_lines, "carrier": "AT&T"}
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "server": "att-mcp",
        "port": 8002,
        "data_source": "🔥 100% LIVE SCRAPING - Devices AND Plans scraped from ATT.com",
        "device_cache": device_cache.get_stats(),
        "plan_cache": plan_cache.get_stats()
    }

@app.get("/cache/stats")
def get_cache_stats():
    return device_cache.get_stats()

@app.post("/cache/clear")
def clear_cache():
    device_cache.clear()
    return {"status": "cleared"}

if __name__ == "__main__":
    print("=" * 60)
    print("🔵 Starting AT&T MCP Server")
    print("=" * 60)
    print(f"📍 Server: http://localhost:8002")
    print(f"🎨 UI Resources: http://localhost:8002/ui/")
    print(f"🔧 API Docs: http://localhost:8002/docs")
    print(f"📊 Data Source: Web Scraping + Cache (No Mock Fallback)")
    print("=" * 60)
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
