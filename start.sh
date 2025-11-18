#!/bin/bash

# Start script for InvPro360 - Backend and Frontend
# Usage: ./start.sh

set -e

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

# Backend PID file
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

echo "================================="
echo "Starting InvPro360 Services"
echo "================================="
echo ""

# Check if services are already running
if [ -f "$BACKEND_PID_FILE" ] && ps -p "$(cat "$BACKEND_PID_FILE")" > /dev/null 2>&1; then
    echo "⚠️  Backend is already running (PID: $(cat "$BACKEND_PID_FILE"))"
    echo "   Use './stop.sh' to stop it first, or './status.sh' to check status"
else
    echo "🚀 Starting Backend..."
    cd "$SCRIPT_DIR/apps/backend"
    
    # Activate virtual environment
    if [ -d "venv/bin" ]; then
        source venv/bin/activate
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found at apps/backend/venv"
        exit 1
    fi
    
    # Start Django development server in background
    python manage.py runserver > "$PID_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    echo "✅ Backend started (PID: $BACKEND_PID)"
    echo "   Logs: $PID_DIR/backend.log"
    echo "   API: http://localhost:8000"
fi

echo ""

# Check if frontend is already running
if [ -f "$FRONTEND_PID_FILE" ] && ps -p "$(cat "$FRONTEND_PID_FILE")" > /dev/null 2>&1; then
    echo "⚠️  Frontend is already running (PID: $(cat "$FRONTEND_PID_FILE"))"
    echo "   Use './stop.sh' to stop it first, or './status.sh' to check status"
else
    echo "🚀 Starting Frontend..."
    cd "$SCRIPT_DIR/apps/frontend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install --legacy-peer-deps
    fi
    
    # Start Next.js development server in background
    npm run dev > "$PID_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    echo "   Logs: $PID_DIR/frontend.log"
    echo "   App: http://localhost:3000"
fi

echo ""
echo "================================="
echo "✅ Services Started Successfully"
echo "================================="
echo ""
echo "📊 Check status: ./status.sh"
echo "🛑 Stop services: ./stop.sh"
echo ""
echo "Backend API: http://localhost:8000"
echo "Frontend App: http://localhost:3000"
echo ""

