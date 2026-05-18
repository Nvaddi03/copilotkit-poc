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
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.run/logs"
BACKEND_PID="$RUN_DIR/backend.pid"
FRONTEND_PID="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

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
  start_backend && start_frontend
  echo
  cmd_status
}

cmd_stop() {
  stop_one frontend "$FRONTEND_PID" "$FRONTEND_PORT"
  stop_one backend  "$BACKEND_PID"  "$BACKEND_PORT"
}

cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start
}

cmd_status() {
  info "Status:"
  if is_running "$BACKEND_PID"; then
    ok "backend  : pid $(cat "$BACKEND_PID")  http://localhost:$BACKEND_PORT/health"
  else
    err "backend  : stopped"
  fi
  if is_running "$FRONTEND_PID"; then
    ok "frontend : pid $(cat "$FRONTEND_PID")  http://localhost:$FRONTEND_PORT"
  else
    err "frontend : stopped"
  fi
}

cmd_logs() {
  local which="${1:-backend}"
  case "$which" in
    backend)  tail -n 100 -f "$BACKEND_LOG"  ;;
    frontend) tail -n 100 -f "$FRONTEND_LOG" ;;
    *) err "unknown log target: $which (use backend|frontend)"; exit 2 ;;
  esac
}

case "${1:-}" in
  start)   cmd_start   ;;
  stop)    cmd_stop    ;;
  restart) cmd_restart ;;
  status)  cmd_status  ;;
  logs)    cmd_logs "${2:-backend}" ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend]}"
    exit 1
    ;;
esac
