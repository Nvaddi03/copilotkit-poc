#!/bin/bash
# Start backend, runtime, and frontend for CopilotKit POC
cd $(dirname "$0")/..

# Start backend
(cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 &)
# Start runtime
(cd backend/runtime && npm run dev &)
# Start frontend
(cd frontend && npm run dev &)

wait
