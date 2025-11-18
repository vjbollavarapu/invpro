#!/bin/bash

# Status script for InvPro360 - Backend and Frontend
# Usage: ./status.sh

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# PID files
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

echo "================================="
echo "InvPro360 Services Status"
echo "================================="
echo ""

# Check Backend
echo "📦 Backend (Port 8000):"
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $BACKEND_PID)"
        echo "   🌐 http://localhost:8000"
        
        # Check if port is actually listening
        if lsof -ti:8000 > /dev/null 2>&1 || nc -z localhost 8000 2>/dev/null; then
            echo "   ✅ Port 8000 is listening"
        else
            echo "   ⚠️  Process running but port 8000 not responding"
        fi
    else
        echo "   ❌ Not running (PID file exists but process not found)"
        echo "   💡 Run './stop.sh' to clean up stale PID file"
    fi
else
    if lsof -ti:8000 > /dev/null 2>&1 || nc -z localhost 8000 2>/dev/null; then
        echo "   ⚠️  Port 8000 is in use (may be started manually)"
    else
        echo "   ❌ Not running"
    fi
fi

echo ""

# Check Frontend
echo "🎨 Frontend (Port 3000):"
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $FRONTEND_PID)"
        echo "   🌐 http://localhost:3000"
        
        # Check if port is actually listening
        if lsof -ti:3000 > /dev/null 2>&1 || nc -z localhost 3000 2>/dev/null; then
            echo "   ✅ Port 3000 is listening"
        else
            echo "   ⚠️  Process running but port 3000 not responding"
        fi
    else
        echo "   ❌ Not running (PID file exists but process not found)"
        echo "   💡 Run './stop.sh' to clean up stale PID file"
    fi
else
    if lsof -ti:3000 > /dev/null 2>&1 || nc -z localhost 3000 2>/dev/null; then
        echo "   ⚠️  Port 3000 is in use (may be started manually)"
    else
        echo "   ❌ Not running"
    fi
fi

echo ""
echo "================================="
echo ""

# Show log file locations if they exist
if [ -f "$PID_DIR/backend.log" ]; then
    echo "📄 Backend logs: $PID_DIR/backend.log"
fi
if [ -f "$PID_DIR/frontend.log" ]; then
    echo "📄 Frontend logs: $PID_DIR/frontend.log"
fi

echo ""

