# devctl.sh - Development Control Script

Unified control script for managing all services in the CopilotKit POC project.

## Overview

The `devctl.sh` script provides a single command to start, stop, restart, and monitor:
- **Frontend** (Next.js) on port 3000
- **Backend** (FastAPI) on port 8000
- **Verizon MCP Server** on port 8001
- **AT&T MCP Server** on port 8002
- **T-Mobile MCP Server** on port 8003

## Usage

```bash
./scripts/devctl.sh {start|stop|restart|status|logs}
```

---

## Commands

### 1. Start All Services

```bash
./scripts/devctl.sh start
```

**What it does:**
1. Starts all 3 MCP servers (Verizon, AT&T, T-Mobile)
2. Starts the FastAPI backend
3. Starts the Next.js frontend
4. Displays status of all services

**Output:**
```
▸ Starting all MCP servers...
▸ Starting Verizon MCP server on :8001
  ✓ Verizon pid 64440  log: .run/logs/verizon-mcp.log
▸ Starting AT&T MCP server on :8002
  ✓ AT&T pid 64457  log: .run/logs/att-mcp.log
▸ Starting T-Mobile MCP server on :8003
  ✓ T-Mobile pid 64470  log: .run/logs/tmobile-mcp.log
▸ Starting backend (FastAPI) on :8000
  ✓ backend pid 64485  log: .run/logs/backend.log
▸ Starting frontend (Next.js) on :3000
  ✓ frontend pid 64496  log: .run/logs/frontend.log
  ✓ open http://localhost:3000

▸ Status:
  ✓ 🔴 Verizon : pid 64440  http://localhost:8001
  ✓ 🔵 AT&T    : pid 64457  http://localhost:8002
  ✓ 🟣 T-Mobile: pid 64470  http://localhost:8003
  ✓ backend   : pid 64485  http://localhost:8000/health
  ✓ frontend  : pid 64496  http://localhost:3000
```

---

### 2. Stop All Services

```bash
./scripts/devctl.sh stop
```

**What it does:**
- Stops all running services gracefully
- Kills any leftover processes on ports
- Cleans up PID files

**Output:**
```
▸ Stopping frontend (pid 64496)
  ✓ frontend stopped
▸ Stopping backend (pid 64485)
  ✓ backend stopped
▸ Stopping Verizon MCP (pid 64440)
  ✓ Verizon MCP stopped
▸ Stopping AT&T MCP (pid 64457)
  ✓ AT&T MCP stopped
▸ Stopping T-Mobile MCP (pid 64470)
  ✓ T-Mobile MCP stopped
```

---

### 3. Restart All Services

```bash
./scripts/devctl.sh restart
```

**What it does:**
- Stops all services
- Waits 1 second
- Starts all services
- Displays status

**Use case:**
- After making code changes to any service
- When services become unresponsive
- After editing configuration files

---

### 4. Check Status

```bash
./scripts/devctl.sh status
```

**What it does:**
- Checks if each service is running
- Displays PID and URL for each service
- Shows ✓ for running, ✗ for stopped

**Output:**
```
▸ Status:

▸ Core Services:
  ✓ backend   : pid 64485  http://localhost:8000/health
  ✓ frontend  : pid 64496  http://localhost:3000

▸ MCP Servers:
  ✓ 🔴 Verizon : pid 64440  http://localhost:8001
  ✓ 🔵 AT&T    : pid 64457  http://localhost:8002
  ✓ 🟣 T-Mobile: pid 64470  http://localhost:8003
```

---

### 5. View Logs

```bash
./scripts/devctl.sh logs [service]
```

**Available services:**
- `backend` - FastAPI backend logs
- `frontend` - Next.js frontend logs
- `verizon` - Verizon MCP server logs
- `att` - AT&T MCP server logs
- `tmobile` - T-Mobile MCP server logs
- `all` - All logs combined (multi-tail)

**Examples:**

```bash
# View backend logs
./scripts/devctl.sh logs backend

# View Verizon MCP server logs
./scripts/devctl.sh logs verizon

# View all logs at once
./scripts/devctl.sh logs all
```

**Default:** If no service is specified, shows backend logs.

---

## File Locations

### PID Files (Process IDs)
```
.run/backend.pid
.run/frontend.pid
.run/verizon-mcp.pid
.run/att-mcp.pid
.run/tmobile-mcp.pid
```

### Log Files
```
.run/logs/backend.log
.run/logs/frontend.log
.run/logs/verizon-mcp.log
.run/logs/att-mcp.log
.run/logs/tmobile-mcp.log
```

---

## Port Configuration

Default ports (can be overridden with environment variables):

```bash
BACKEND_PORT=8000   # FastAPI backend
FRONTEND_PORT=3000  # Next.js frontend
VERIZON_PORT=8001   # Verizon MCP server
ATT_PORT=8002       # AT&T MCP server
TMOBILE_PORT=8003   # T-Mobile MCP server
```

**Custom ports:**
```bash
FRONTEND_PORT=3001 ./scripts/devctl.sh start
```

---

## Common Workflows

### Daily Development Start

```bash
# Start all services
./scripts/devctl.sh start

# Open browser to http://localhost:3000
```

### After Code Changes

```bash
# Restart all services to pick up changes
./scripts/devctl.sh restart
```

### Debugging Issues

```bash
# Check which services are running
./scripts/devctl.sh status

# View logs for specific service
./scripts/devctl.sh logs verizon

# View all logs together
./scripts/devctl.sh logs all
```

### End of Day

```bash
# Stop all services
./scripts/devctl.sh stop
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
./scripts/devctl.sh logs [service-name]
```

**Common issues:**
- Port already in use: `kill_port` function automatically handles this
- Missing dependencies: Run `npm install` or `pip install -r requirements.txt`
- Wrong directory: Script automatically changes to correct directories

### Service Shows as Stopped But Port is Occupied

```bash
# Stop will kill any processes on the ports
./scripts/devctl.sh stop

# Then start fresh
./scripts/devctl.sh start
```

### Want to Start Individual Services

The script always starts all services together. To start individually:

```bash
# Start only MCP servers
cd backend/mcp_servers/verizon_mcp && python server.py &
cd backend/mcp_servers/att_mcp && python server.py &
cd backend/mcp_servers/tmobile_mcp && python server.py &

# Start backend
cd backend && uvicorn main:app --reload &

# Start frontend
cd frontend && npm run dev &
```

---

## Integration with Frontend

Once all services are running, the frontend will connect to:
- **Backend API**: http://localhost:8000
- **Verizon MCP**: http://localhost:8001 (via backend proxy)
- **AT&T MCP**: http://localhost:8002 (via backend proxy)
- **T-Mobile MCP**: http://localhost:8003 (via backend proxy)

The MCP servers are registered in `/app/api/copilotkit/route.ts`:

```typescript
mcpServers: [
  { name: "verizon-mcp", url: "http://localhost:8001" },
  { name: "att-mcp", url: "http://localhost:8002" },
  { name: "tmobile-mcp", url: "http://localhost:8003" }
]
```

---

## Advanced Usage

### Running in Background

The script already runs all services in background with `nohup`:

```bash
./scripts/devctl.sh start
# All services continue running even if you close the terminal
```

### Checking Individual Service Health

```bash
# Verizon MCP
curl http://localhost:8001/

# AT&T MCP
curl http://localhost:8002/

# T-Mobile MCP
curl http://localhost:8003/

# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

### Environment-Specific Configuration

```bash
# Development (default)
./scripts/devctl.sh start

# Custom environment
export BACKEND_PORT=8001
export FRONTEND_PORT=3001
./scripts/devctl.sh start
```

---

## Benefits of Using devctl.sh

✅ **Single Command** - Start/stop all 5 services at once  
✅ **Automatic Cleanup** - Kills leftover processes on ports  
✅ **Process Management** - PID tracking for each service  
✅ **Log Aggregation** - View logs from all services  
✅ **Status Monitoring** - Quick health check of all services  
✅ **Consistent Environment** - Same startup sequence every time  
✅ **Error Handling** - Automatic retries and port cleanup  

---

## Quick Reference

```bash
# Most common commands
./scripts/devctl.sh start      # Start all services
./scripts/devctl.sh stop       # Stop all services
./scripts/devctl.sh restart    # Restart all services
./scripts/devctl.sh status     # Check status
./scripts/devctl.sh logs all   # View all logs

# Service URLs (after start)
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
Verizon:    http://localhost:8001
AT&T:       http://localhost:8002
T-Mobile:   http://localhost:8003
```

---

**Last Updated:** Week 2 Day 9  
**Status:** ✅ All 5 services operational  
**Next Step:** Frontend integration (Day 10)
