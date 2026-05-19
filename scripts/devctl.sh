#!/usr/bin/env bash
# devctl.sh - start / stop / restart / status for the CopilotKit POC
# Usage:
#   ./scripts/devctl.sh start
#   ./scripts/devctl.sh stop
#   ./scripts/devctl.sh restart
#   ./scripts/devctl.sh status
#   ./scripts/devctl.sh logs [backend|frontend]

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
MCP_SERVERS_DIR="$BACKEND_DIR/mcp_servers"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.run/logs"

# PID files
BACKEND_PID="$RUN_DIR/backend.pid"
FRONTEND_PID="$RUN_DIR/frontend.pid"
VERIZON_PID="$RUN_DIR/verizon-mcp.pid"
ATT_PID="$RUN_DIR/att-mcp.pid"
TMOBILE_PID="$RUN_DIR/tmobile-mcp.pid"

# Log files
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
VERIZON_LOG="$LOG_DIR/verizon-mcp.log"
ATT_LOG="$LOG_DIR/att-mcp.log"
TMOBILE_LOG="$LOG_DIR/tmobile-mcp.log"

# Ports
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
VERIZON_PORT="${VERIZON_PORT:-8001}"
ATT_PORT="${ATT_PORT:-8002}"
TMOBILE_PORT="${TMOBILE_PORT:-8003}"

mkdir -p "$RUN_DIR" "$LOG_DIR"

color()  { printf "\033[%sm%s\033[0m" "$1" "$2"; }
ok()     { echo "  $(color '32' '✓') $*"; }
warn()   { echo "  $(color '33' '!') $*"; }
err()    { echo "  $(color '31' '✗') $*"; }
info()   { echo "$(color '36' '▸') $*"; }

is_running() {
  local pidfile="$1"
  [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    warn "killing leftover process(es) on :$port -> $pids"
    kill $pids 2>/dev/null || true
    sleep 1
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  fi
}

start_backend() {
  info "Starting backend (FastAPI) on :$BACKEND_PORT"
  if is_running "$BACKEND_PID"; then
    ok "backend already running (pid $(cat "$BACKEND_PID"))"
    return
  fi
  kill_port "$BACKEND_PORT"
  cd "$BACKEND_DIR"
  # prefer a local venv if present
  if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.venv/bin/activate"
  elif [ -f "$BACKEND_DIR/.venv/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/.venv/bin/activate"
  fi
  nohup python -m uvicorn main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload \
    > "$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID"
  sleep 2
  if is_running "$BACKEND_PID"; then
    ok "backend pid $(cat "$BACKEND_PID")  log: $BACKEND_LOG"
  else
    err "backend failed to start. Last log lines:"
    tail -n 30 "$BACKEND_LOG" || true
    return 1
  fi
}

start_frontend() {
  info "Starting frontend (Next.js) on :$FRONTEND_PORT"
  if is_running "$FRONTEND_PID"; then
    ok "frontend already running (pid $(cat "$FRONTEND_PID"))"
    return
  fi
  kill_port "$FRONTEND_PORT"
  cd "$FRONTEND_DIR"
  if [ ! -d node_modules ]; then
    warn "node_modules missing, running npm install..."
    npm install --no-audit --no-fund
  fi
  nohup npm run dev -- -p "$FRONTEND_PORT" \
    > "$FRONTEND_LOG" 2>&1 &
  echo $! > "$FRONTEND_PID"
  sleep 3
  if is_running "$FRONTEND_PID"; then
    ok "frontend pid $(cat "$FRONTEND_PID")  log: $FRONTEND_LOG"
    ok "open http://localhost:$FRONTEND_PORT"
  else
    err "frontend failed to start. Last log lines:"
    tail -n 30 "$FRONTEND_LOG" || true
    return 1
  fi
}

start_mcp_server() {
  local name="$1" port="$2" pidfile="$3" logfile="$4" server_dir="$5"
  info "Starting $name MCP server on :$port"
  if is_running "$pidfile"; then
    ok "$name already running (pid $(cat "$pidfile"))"
    return
  fi
  kill_port "$port"
  cd "$server_dir"
  # Activate venv
  if [ -f "$BACKEND_DIR/.venv/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/.venv/bin/activate"
  fi
  nohup python server.py > "$logfile" 2>&1 &
  echo $! > "$pidfile"
  sleep 2
  if is_running "$pidfile"; then
    ok "$name pid $(cat "$pidfile")  log: $logfile"
  else
    err "$name failed to start. Last log lines:"
    tail -n 30 "$logfile" || true
    return 1
  fi
}

start_all_mcp_servers() {
  info "Starting all MCP servers..."
  start_mcp_server "Verizon" "$VERIZON_PORT" "$VERIZON_PID" "$VERIZON_LOG" "$MCP_SERVERS_DIR/verizon_mcp"
  start_mcp_server "AT&T" "$ATT_PORT" "$ATT_PID" "$ATT_LOG" "$MCP_SERVERS_DIR/att_mcp"
  start_mcp_server "T-Mobile" "$TMOBILE_PORT" "$TMOBILE_PID" "$TMOBILE_LOG" "$MCP_SERVERS_DIR/tmobile_mcp"
}

stop_one() {
  local name="$1" pidfile="$2" port="$3"
  if is_running "$pidfile"; then
    local pid; pid="$(cat "$pidfile")"
    info "Stopping $name (pid $pid)"
    # kill whole process group (npm spawns child processes)
    kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    sleep 1
    kill -KILL -"$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    ok "$name stopped"
  else
    warn "$name not running via pidfile"
  fi
  rm -f "$pidfile"
  kill_port "$port"
}

cmd_start() {
  start_all_mcp_servers
  start_backend && start_frontend
  echo
  cmd_status
}

cmd_stop() {
  stop_one frontend "$FRONTEND_PID" "$FRONTEND_PORT"
  stop_one backend  "$BACKEND_PID"  "$BACKEND_PORT"
  stop_one "Verizon MCP" "$VERIZON_PID" "$VERIZON_PORT"
  stop_one "AT&T MCP" "$ATT_PID" "$ATT_PORT"
  stop_one "T-Mobile MCP" "$TMOBILE_PID" "$TMOBILE_PORT"
}

cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start
}

cmd_status() {
  info "Status:"
  echo ""
  info "Core Services:"
  if is_running "$BACKEND_PID"; then
    ok "backend   : pid $(cat "$BACKEND_PID")  http://localhost:$BACKEND_PORT/health"
  else
    err "backend   : stopped"
  fi
  if is_running "$FRONTEND_PID"; then
    ok "frontend  : pid $(cat "$FRONTEND_PID")  http://localhost:$FRONTEND_PORT"
  else
    err "frontend  : stopped"
  fi
  echo ""
  info "MCP Servers:"
  if is_running "$VERIZON_PID"; then
    ok "🔴 Verizon : pid $(cat "$VERIZON_PID")  http://localhost:$VERIZON_PORT"
  else
    err "🔴 Verizon : stopped"
  fi
  if is_running "$ATT_PID"; then
    ok "🔵 AT&T    : pid $(cat "$ATT_PID")  http://localhost:$ATT_PORT"
  else
    err "🔵 AT&T    : stopped"
  fi
  if is_running "$TMOBILE_PID"; then
    ok "🟣 T-Mobile: pid $(cat "$TMOBILE_PID")  http://localhost:$TMOBILE_PORT"
  else
    err "🟣 T-Mobile: stopped"
  fi
}

cmd_logs() {
  local which="${1:-backend}"
  case "$which" in
    backend)  tail -n 100 -f "$BACKEND_LOG"  ;;
    frontend) tail -n 100 -f "$FRONTEND_LOG" ;;
    verizon)  tail -n 100 -f "$VERIZON_LOG"  ;;
    att)      tail -n 100 -f "$ATT_LOG"      ;;
    tmobile)  tail -n 100 -f "$TMOBILE_LOG"  ;;
    all)
      info "Tailing all logs (Ctrl+C to stop)..."
      tail -n 50 -f "$BACKEND_LOG" "$FRONTEND_LOG" "$VERIZON_LOG" "$ATT_LOG" "$TMOBILE_LOG"
      ;;
    *) err "unknown log target: $which (use backend|frontend|verizon|att|tmobile|all)"; exit 2 ;;
  esac
}

case "${1:-}" in
  start)   cmd_start   ;;
  stop)    cmd_stop    ;;
  restart) cmd_restart ;;
  status)  cmd_status  ;;
  logs)    cmd_logs "${2:-backend}" ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend|verizon|att|tmobile|all]}"
    exit 1
    ;;
esac
