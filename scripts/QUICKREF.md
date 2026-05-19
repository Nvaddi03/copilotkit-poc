# devctl.sh - Quick Reference Card

## 🚀 One-Line Commands

```bash
# Start everything (5 services)
./scripts/devctl.sh start

# Stop everything
./scripts/devctl.sh stop

# Restart everything
./scripts/devctl.sh restart

# Check status
./scripts/devctl.sh status

# View logs
./scripts/devctl.sh logs all
```

---

## 📊 What Gets Started

| Service | Port | URL |
|---------|------|-----|
| 🔴 Verizon MCP | 8001 | http://localhost:8001 |
| 🔵 AT&T MCP | 8002 | http://localhost:8002 |
| 🟣 T-Mobile MCP | 8003 | http://localhost:8003 |
| 🎯 Backend API | 8000 | http://localhost:8000 |
| 🌐 Frontend | 3000 | http://localhost:3000 |

---

## 📝 Log Files

```bash
# View specific service
./scripts/devctl.sh logs verizon   # Verizon MCP
./scripts/devctl.sh logs att       # AT&T MCP
./scripts/devctl.sh logs tmobile   # T-Mobile MCP
./scripts/devctl.sh logs backend   # FastAPI backend
./scripts/devctl.sh logs frontend  # Next.js frontend

# View all at once
./scripts/devctl.sh logs all
```

**Log file locations:**
```
.run/logs/verizon-mcp.log
.run/logs/att-mcp.log
.run/logs/tmobile-mcp.log
.run/logs/backend.log
.run/logs/frontend.log
```

---

## ✅ Verification Commands

```bash
# Check all services are running
./scripts/devctl.sh status

# Test MCP servers
curl http://localhost:8001/ | jq .status
curl http://localhost:8002/ | jq .status
curl http://localhost:8003/ | jq .status

# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

---

## 🔄 Common Workflows

### Daily Start
```bash
cd /Users/narasimhavaddi/Downloads/CTS/CopilotKit/copilotkit-poc
./scripts/devctl.sh start
```

### After Code Changes
```bash
./scripts/devctl.sh restart
```

### Debugging
```bash
./scripts/devctl.sh status
./scripts/devctl.sh logs all
```

### End of Day
```bash
./scripts/devctl.sh stop
```

---

## 🆘 Troubleshooting

### Service won't start?
```bash
# Check logs
./scripts/devctl.sh logs [service-name]

# Force restart
./scripts/devctl.sh stop
./scripts/devctl.sh start
```

### Port conflict?
```bash
# devctl.sh automatically kills processes on ports
./scripts/devctl.sh stop
./scripts/devctl.sh start
```

### Want custom ports?
```bash
VERIZON_PORT=9001 ATT_PORT=9002 TMOBILE_PORT=9003 ./scripts/devctl.sh start
```

---

## 📍 File Locations

**Script:**
```
/scripts/devctl.sh
```

**PID Files:**
```
.run/backend.pid
.run/frontend.pid
.run/verizon-mcp.pid
.run/att-mcp.pid
.run/tmobile-mcp.pid
```

**Logs:**
```
.run/logs/backend.log
.run/logs/frontend.log
.run/logs/verizon-mcp.log
.run/logs/att-mcp.log
.run/logs/tmobile-mcp.log
```

---

## 💡 Key Features

✅ Single command to start/stop all 5 services  
✅ Automatic port cleanup  
✅ Process tracking (PID files)  
✅ Log aggregation  
✅ Status monitoring  
✅ Background execution (nohup)  

---

**Quick Access:** Bookmark this file for daily use!
