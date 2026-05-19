"""
Verizon MCP Server
==================

FastAPI-based Model Context Protocol server for Verizon.
Exposes tools with UI resources for device comparison.

MCP Apps Architecture:
- Tools expose `ui_resource` URLs
- CopilotKit auto-fetches and renders HTML in chat
- No frontend code needed - all UI is server-side
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import json
import os
import uvicorn

# Import scrapers and cache
from scraper import VerizonScraper
from plan_scraper import PlanScraper
from cache import device_cache, Cache

# Initialize plan cache
plan_cache = Cache(ttl=3600)  # 1 hour TTL for plans

app = FastAPI(
    title="Verizon MCP Server",
    description="Model Context Protocol server for Verizon carrier data",
    version="1.0.0"
)

# CORS middleware for CopilotKit integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static UI resources (MCP Apps)
app.mount("/ui", StaticFiles(directory="public/ui"), name="ui")

# Initialize scrapers for live data (NO MORE STATIC FILES!)
scraper = VerizonScraper()  # For devices
plan_scraper = PlanScraper()  # For plans


# ============================================================================
# MCP Server Info Endpoint
# ============================================================================

@app.get("/")
def root():
    """MCP Server information endpoint"""
    cache_stats = device_cache.get_stats()
    
    return {
        "mcp_server": "verizon",
        "carrier": "Verizon",
        "version": "1.0.0",
        "status": "operational",
        "cache": cache_stats,
        "tools": [
            {
                "name": "get_device_info",
                "description": "Get device pricing and details from Verizon. Supports: smartphones, tablets, smartwatches, hotspots. Query by device name (e.g., 'iPhone 15 Pro', 'Galaxy Tab S9', 'Apple Watch Series 9', 'Nighthawk M6').",
                "parameters": {
                    "device_slug": "Device name or slug (e.g., 'iphone-15-pro', 'galaxy-tab-s9')",
                    "storage": "Storage capacity (e.g., '128GB', '256GB', '512GB', '1TB')",
                    "device_type": "Device category: 'phone', 'tablet', 'watch', 'hotspot' (optional)"
                },
                "ui_resource": "http://localhost:8001/ui/device-card.html"
            },
            {
                "name": "get_plans",
                "description": "Get Verizon service plans. Supports: wireless/mobile plans (unlimited data, prepaid), internet plans (5G/LTE home), Fios plans. Query by service type.",
                "parameters": {
                    "num_lines": "Number of lines (for wireless plans)",
                    "plan_type": "Plan category: 'wireless', 'internet', 'fios', 'prepaid' (optional)"
                },
                "ui_resource": "http://localhost:8001/ui/plans-table.html"
            },
            {
                "name": "calculate_total_cost",
                "description": "Calculate total cost for device + plan",
                "ui_resource": None
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
                "ui_resource": "http://localhost:8001/ui/device-grid.html"
            },
            {
                "name": "compare_devices",
                "description": "Compare multiple devices side-by-side. Example: 'compare iPhone 15 Pro vs Galaxy S24 Ultra'.",
                "parameters": {
                    "device_slugs": "Array of device slugs to compare (2-4 devices)"
                },
                "ui_resource": "http://localhost:8001/ui/device-comparison.html"
            },
            {
                "name": "get_internet_plans",
                "description": "Get Verizon internet plans (5G Home, LTE Home, Fios). Query by speed or address availability.",
                "parameters": {
                    "speed": "Desired speed: '300Mbps', '500Mbps', '1Gbps', '2Gbps' (optional)",
                    "zip_code": "ZIP code for availability check (optional)"
                },
                "ui_resource": "http://localhost:8001/ui/internet-plans.html"
            },
            {
                "name": "calculate_bundle_savings",
                "description": "Calculate savings when bundling wireless + internet (Fios/5G Home). Example: '2 phone lines + 1Gbps Fios'.",
                "parameters": {
                    "wireless_lines": "Number of phone lines",
                    "internet_speed": "Internet plan speed",
                    "include_tv": "Include TV service (boolean)"
                },
                "ui_resource": "http://localhost:8001/ui/bundle-calculator.html"
            }
        ],
        "data_source": "scraping + cache (no fallback)",
        "endpoints": {
            "tools": "/tools",
            "ui_resources": "/ui/*",
            "cache_stats": "/cache/stats"
        }
    }


# ============================================================================
# MCP Tool: get_device_info
# ============================================================================

class DeviceRequest(BaseModel):
    device_slug: str = "iphone-15-pro"
    storage: Optional[str] = "128GB"

@app.post("/tools/get_device_info")
async def get_device_info(request: DeviceRequest) -> Dict:
    """
    Get device information from Verizon
    
    Data Priority:
    1. Check cache (1-hour TTL)
    2. Try web scraping
    3. Fallback to mock data
    
    This tool exposes a UI resource for MCP Apps.
    CopilotKit will auto-render the device card in chat.
    
    Returns:
        Device data + ui_resource URL
    """
    cache_key = f"verizon_{request.device_slug}_{request.storage}"
    
    # 1. Check cache
    cached_device = device_cache.get(cache_key)
    if cached_device:
        print(f"✅ Cache hit: {request.device_slug}")
        cached_device["selected_storage"] = request.storage
        cached_device["_source"] = "cache"
        
        # Detect out-of-stock status from colors
        colors = cached_device.get("colors", [])
        all_out_of_stock = all("out of stock" in str(color).lower() for color in colors if color and color != "Color")
        
        if all_out_of_stock and len(colors) > 1:
            cached_device["availability"] = "Out of Stock"
        else:
            cached_device["availability"] = "In Stock"
        
        # Use storage-specific pricing if available
        storage_prices = cached_device.get("storage_prices", {})
        if request.storage in storage_prices:
            cached_device["price_monthly"] = storage_prices[request.storage]
            cached_device["price_full"] = round(storage_prices[request.storage] * 36, 2)
        
        return {
            "tool": "get_device_info",
            "carrier": "Verizon",
            "data": cached_device,
            "ui_resource": "http://localhost:8001/ui/device-card.html",
            "ui_data": cached_device
        }
    
    # 2. Try web scraping
    print(f"🌐 Scraping: {request.device_slug}")
    scraped_device = await scraper.scrape_device(request.device_slug, request.storage)
    
    if scraped_device:
        # Post-process scraped data
        scraped_device["selected_storage"] = request.storage
        
        # Detect out-of-stock status from colors
        colors = scraped_device.get("colors", [])
        all_out_of_stock = all("out of stock" in str(color).lower() for color in colors if color and color != "Color")
        
        if all_out_of_stock and len(colors) > 1:
            scraped_device["availability"] = "Out of Stock"
        else:
            scraped_device["availability"] = "In Stock"
        
        # Use storage-specific pricing if available
        storage_prices = scraped_device.get("storage_prices", {})
        if request.storage in storage_prices:
            scraped_device["price_monthly"] = storage_prices[request.storage]
            # Estimate full price based on monthly (assuming 36-month plan)
            scraped_device["price_full"] = round(storage_prices[request.storage] * 36, 2)
        
        # Cache the result
        device_cache.set(cache_key, scraped_device)
        
        return {
            "tool": "get_device_info",
            "carrier": "Verizon",
            "data": scraped_device,
            "ui_resource": "http://localhost:8001/ui/device-card.html",
            "ui_data": scraped_device
        }
    
    # No fallback - scraping failed
    print(f"❌ Scraping failed for: {request.device_slug}")
    raise HTTPException(
        status_code=503, 
        detail=f"Unable to fetch device data for {request.device_slug}. Scraping failed and no cached data available."
    )


# ============================================================================
# MCP Tool: get_plans
# ============================================================================

class PlansRequest(BaseModel):
    num_lines: int = 1

@app.post("/tools/get_plans")
async def get_plans(request: PlansRequest) -> Dict:
    """
    Get Verizon unlimited plans - SCRAPED LIVE from Verizon.com
    
    Returns:
        Plans data + ui_resource URL for table rendering
    """
    # Check cache first
    cache_key = "verizon_plans"
    cached_data = plan_cache.get(cache_key)
    
    if cached_data:
        plan_data = cached_data
    else:
        # Scrape live plans from Verizon.com
        plan_data = await plan_scraper.scrape_plans()
        # Cache for 1 hour
        plan_cache.set(cache_key, plan_data)
    
    plans = []
    
    for plan in plan_data["plans"]:
        plan_copy = plan.copy()
        # Get price for requested number of lines
        price_key = str(min(request.num_lines, 5))  # Max 5 lines in pricing
        plan_copy["price"] = plan["price_per_line"].get(price_key, plan["price_per_line"]["1"])
        plan_copy["lines"] = request.num_lines
        plans.append(plan_copy)
    
    return {
        "tool": "get_plans",
        "carrier": "Verizon",
        "data": {
            "plans": plans,
            "lines": request.num_lines
        },
        
        # UI Resource for plans table
        "ui_resource": "http://localhost:8001/ui/plans-table.html",
        "ui_data": {
            "plans": plans,
            "lines": request.num_lines,
            "carrier": "Verizon"
        }
    }


# ============================================================================
# MCP Tool: calculate_total_cost
# ============================================================================

class CostRequest(BaseModel):
    device_slug: str
    plan_id: str
    num_lines: int = 1
    months: int = 36

@app.post("/tools/calculate_total_cost")
async def calculate_total_cost(request: CostRequest) -> Dict:
    """
    Calculate total cost of ownership - BOTH device and plans scraped live
    
    Args:
        device_slug: Device ID
        plan_id: Plan ID
        num_lines: Number of lines
        months: Contract duration
    
    Returns:
        Cost breakdown (no UI resource - just data)
    """
    # Find device from cache (or trigger scrape if not cached)
    cache_key = f"verizon_{request.device_slug}_128GB"
    device = device_cache.get(cache_key)
    
    if not device:
        # Try to scrape it
        device = await scraper.scrape_device(request.device_slug, "128GB")
        if device:
            device_cache.set(cache_key, device)
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get plans from cache or scrape
    plans_cache_key = "verizon_plans"
    plan_data = plan_cache.get(plans_cache_key)
    
    if not plan_data:
        # Scrape live plans
        plan_data = await plan_scraper.scrape_plans()
        plan_cache.set(plans_cache_key, plan_data)
    
    # Find plan
    plan = next((p for p in plan_data["plans"] if p["id"] == request.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate costs
    device_total = device["price_monthly"] * request.months
    price_key = str(min(request.num_lines, 5))
    plan_monthly = plan["price_per_line"].get(price_key, plan["price_per_line"]["1"])
    plan_total = plan_monthly * request.months * request.num_lines
    
    grand_total = device_total + plan_total
    
    return {
        "tool": "calculate_total_cost",
        "carrier": "Verizon",
        "data": {
            "device_cost": {
                "monthly": device["price_monthly"],
                "total": device_total
            },
            "plan_cost": {
                "monthly": plan_monthly,
                "per_line": plan_monthly,
                "total": plan_total
            },
            "grand_total": grand_total,
            "months": request.months,
            "lines": request.num_lines,
            "breakdown": f"${device['price_monthly']:.2f}/mo device + ${plan_monthly}/mo plan × {request.num_lines} lines × {request.months} months = ${grand_total:,.2f}"
        },
        "ui_resource": None  # No UI for this tool - just data
    }


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "server": "verizon-mcp",
        "port": 8001,
        "data_source": "🔥 100% LIVE SCRAPING - Devices AND Plans scraped from Verizon.com",
        "device_cache": device_cache.get_stats(),
        "plan_cache": plan_cache.get_stats()
    }


@app.get("/cache/stats")
def get_cache_stats():
    """Get cache statistics"""
    return device_cache.get_stats()


@app.post("/cache/clear")
def clear_cache():
    """Clear cache (for testing)"""
    device_cache.clear()
    return {"status": "cleared", "message": "Cache has been cleared"}


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🔴 Starting Verizon MCP Server")
    print("=" * 60)
    print(f"📍 Server: http://localhost:8001")
    print(f"🎨 UI Resources: http://localhost:8001/ui/")
    print(f"🔧 API Docs: http://localhost:8001/docs")
    print(f"📊 Data Source: Web Scraping + Cache (No Mock Fallback)")
    print("=" * 60)
    print()
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
