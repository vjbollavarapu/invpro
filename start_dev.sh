#!/bin/bash

# Start Development Servers
# This script starts both backend and frontend in separate terminals

echo "=========================================="
echo "Starting InvPro360 Development Servers"
echo "=========================================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use osascript to open new terminal windows
    
    echo "Starting Backend Server..."
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/apps/backend && source venv/bin/activate && python manage.py runserver"'
    
    sleep 2
    
    echo "Starting Frontend Server..."
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/apps/frontend && npm run dev"'
    
    echo ""
    echo "✅ Servers starting in new terminal windows"
    echo ""
    echo "Backend: http://localhost:8000/api"
    echo "Frontend: http://localhost:3000"
    echo "API Docs: http://localhost:8000/api/docs/"
    echo ""
    echo "Press Ctrl+C in the terminal windows to stop the servers"
    
else
    # Linux/Other - run in background
    echo "Starting Backend Server (background)..."
    cd apps/backend
    source venv/bin/activate
    python manage.py runserver > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    sleep 2
    
    echo "Starting Frontend Server (background)..."
    cd ../frontend
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    
    cd ../..
    
    echo ""
    echo "✅ Servers started in background"
    echo ""
    echo "Backend: http://localhost:8000/api (PID: $BACKEND_PID)"
    echo "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
    echo "API Docs: http://localhost:8000/api/docs/"
    echo ""
    echo "Logs:"
    echo "  Backend: tail -f /tmp/backend.log"
    echo "  Frontend: tail -f /tmp/frontend.log"
    echo ""
    echo "To stop servers:"
    echo "  kill $BACKEND_PID $FRONTEND_PID"
fi

