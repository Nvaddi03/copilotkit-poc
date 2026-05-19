#!/bin/bash

echo "🧹 Clearing all MCP server caches..."
echo ""

# Clear Verizon cache
echo "🔴 Clearing Verizon cache (port 8001)..."
curl -X POST http://localhost:8001/cache/clear 2>/dev/null
echo ""

# Clear AT&T cache
echo "🔵 Clearing AT&T cache (port 8002)..."
curl -X POST http://localhost:8002/cache/clear 2>/dev/null
echo ""

# Clear T-Mobile cache
echo "🟣 Clearing T-Mobile cache (port 8003)..."
curl -X POST http://localhost:8003/cache/clear 2>/dev/null
echo ""

echo "✅ All caches cleared!"
echo ""
echo "Now ask the AI again for device prices - it will fetch FRESH data from carrier websites."
