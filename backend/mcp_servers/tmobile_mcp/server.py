"""
T-Mobile MCP Server
===============

FastAPI-based Model Context Protocol server for T-Mobile.
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

from scraper import TMobileScraper
from plan_scraper import PlanScraper
from cache import device_cache, Cache

# Initialize plan cache
plan_cache = Cache(ttl=3600)  # 1 hour TTL for plans

app = FastAPI(
    title="T-Mobile MCP Server",
    description="Model Context Protocol server for T-Mobile carrier data",
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
scraper = TMobileScraper()  # For devices
plan_scraper = PlanScraper()  # For plans

@app.get("/")
def root():
    cache_stats = device_cache.get_stats()
    return {
        "mcp_server": "tmobile",
        "carrier": "T-Mobile",
        "version": "1.0.0",
        "status": "operational",
        "cache": cache_stats,
        "tools": [
            {
                "name": "get_device_info",
                "description": "Get device pricing and details from T-Mobile. Supports: smartphones, tablets, smartwatches, hotspots. Query by device name (e.g., 'iPhone 15 Pro', 'Galaxy Tab S9', 'Apple Watch Series 9', 'Nighthawk M6').",
                "parameters": {
                    "device_slug": "Device name or slug (e.g., 'iphone-15-pro', 'galaxy-tab-s9')",
                    "storage": "Storage capacity (e.g., '128GB', '256GB', '512GB', '1TB')",
                    "device_type": "Device category: 'phone', 'tablet', 'watch', 'hotspot' (optional)"
                },
                "ui_resource": "http://localhost:8003/ui/device-card.html"
            },
            {
                "name": "get_plans",
                "description": "Get T-Mobile service plans. Supports: wireless/mobile plans (unlimited data, Magenta, prepaid), home internet plans (5G home). Query by service type.",
                "parameters": {
                    "num_lines": "Number of lines (for wireless plans)",
                    "plan_type": "Plan category: 'wireless', 'internet', 'prepaid' (optional)"
                },
                "ui_resource": "http://localhost:8003/ui/plans-table.html"
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
                "ui_resource": "http://localhost:8003/ui/device-grid.html"
            },
            {
                "name": "compare_devices",
                "description": "Compare multiple devices side-by-side. Example: 'compare iPhone 15 Pro vs Galaxy S24 Ultra'.",
                "parameters": {
                    "device_slugs": "Array of device slugs to compare (2-4 devices)"
                },
                "ui_resource": "http://localhost:8003/ui/device-comparison.html"
            },
            {
                "name": "get_internet_plans",
                "description": "Get T-Mobile home internet plans (5G home internet). Query by speed or address availability.",
                "parameters": {
                    "speed": "Desired speed (optional)",
                    "zip_code": "ZIP code for availability check (optional)"
                },
                "ui_resource": "http://localhost:8003/ui/internet-plans.html"
            },
            {
                "name": "calculate_bundle_savings",
                "description": "Calculate savings when bundling wireless + internet. Example: '2 phone lines + 5G home internet'.",
                "parameters": {
                    "wireless_lines": "Number of phone lines",
                    "include_internet": "Include 5G home internet (boolean)"
                },
                "ui_resource": "http://localhost:8003/ui/bundle-calculator.html"
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
    cache_key = f"tmobile_{request.device_slug}_{request.storage}"
    
    # Check cache
    cached_device = device_cache.get(cache_key)
    if cached_device:
        print(f"✅ Cache hit: {request.device_slug}")
        cached_device["selected_storage"] = request.storage
        cached_device["_source"] = "cache"
        return {
            "tool": "get_device_info",
            "carrier": "T-Mobile",
            "data": cached_device,
            "ui_resource": "http://localhost:8003/ui/device-card.html",
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
            "carrier": "T-Mobile",
            "data": scraped_device,
            "ui_resource": "http://localhost:8003/ui/device-card.html",
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
    """Get T-Mobile plans - SCRAPED LIVE from T-Mobile.com"""
    # Check cache first
    cache_key = "tmobile_plans"
    cached_data = plan_cache.get(cache_key)
    
    if cached_data:
        plan_data = cached_data
    else:
        # Scrape live plans from T-Mobile.com
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
        "carrier": "T-Mobile",
        "data": {"plans": plans, "lines": request.num_lines},
        "ui_resource": "http://localhost:8003/ui/plans-table.html",
        "ui_data": {"plans": plans, "lines": request.num_lines, "carrier": "T-Mobile"}
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "server": "tmobile-mcp",
        "port": 8003,
        "data_source": "🔥 100% LIVE SCRAPING - Devices AND Plans scraped from T-Mobile.com",
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
    print("🟣 Starting T-Mobile MCP Server")
    print("=" * 60)
    print(f"📍 Server: http://localhost:8003")
    print(f"🎨 UI Resources: http://localhost:8003/ui/")
    print(f"🔧 API Docs: http://localhost:8003/docs")
    print(f"📊 Data Source: Web Scraping + Cache (No Mock Fallback)")
    print("=" * 60)
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
