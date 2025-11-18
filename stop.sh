#!/bin/bash

# Stop script for InvPro360 - Backend and Frontend
# Usage: ./stop.sh

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# PID files
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

echo "================================="
echo "Stopping InvPro360 Services"
echo "================================="
echo ""

# Stop Backend
echo "🛑 Stopping Backend..."
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        kill "$BACKEND_PID" 2>/dev/null || true
        sleep 1
        
        # Force kill if still running
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            kill -9 "$BACKEND_PID" 2>/dev/null || true
            echo "   ✅ Backend force stopped (PID: $BACKEND_PID)"
        else
            echo "   ✅ Backend stopped (PID: $BACKEND_PID)"
        fi
    else
        echo "   ⚠️  Backend process not found (PID: $BACKEND_PID)"
    fi
    rm -f "$BACKEND_PID_FILE"
else
    echo "   ℹ️  No backend PID file found"
fi

# Also try to kill any process using port 8000 (if PID file method didn't work)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   🔍 Found process on port 8000, stopping..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo ""

# Stop Frontend
echo "🛑 Stopping Frontend..."
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        # Kill the process and its children (Next.js spawns child processes)
        kill "$FRONTEND_PID" 2>/dev/null || true
        sleep 1
        
        # Force kill if still running
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            kill -9 "$FRONTEND_PID" 2>/dev/null || true
            echo "   ✅ Frontend force stopped (PID: $FRONTEND_PID)"
        else
            echo "   ✅ Frontend stopped (PID: $FRONTEND_PID)"
        fi
    else
        echo "   ⚠️  Frontend process not found (PID: $FRONTEND_PID)"
    fi
    rm -f "$FRONTEND_PID_FILE"
else
    echo "   ℹ️  No frontend PID file found"
fi

# Also try to kill any process using port 3000 (if PID file method didn't work)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   🔍 Found process on port 3000, stopping..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo ""
echo "================================="
echo "✅ Services Stopped"
echo "================================="
echo ""
echo "📊 Check status: ./status.sh"
echo "🚀 Start services: ./start.sh"
echo ""

