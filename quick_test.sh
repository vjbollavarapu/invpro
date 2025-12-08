#!/bin/bash

# Quick Test Script (No Docker Required)
# Tests backend and frontend directly

set -e

echo "=========================================="
echo "Quick Application Test"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Backend Python Environment
echo "1️⃣  Testing Backend Environment..."
echo "----------------------------------------"
cd apps/backend

if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}✅ Virtual environment activated${NC}"
    python --version
    pip list | grep -i django || echo -e "${YELLOW}⚠️  Django not found in venv${NC}"
else
    echo -e "${YELLOW}⚠️  No virtual environment found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Check Django
if python manage.py --version 2>/dev/null; then
    echo -e "${GREEN}✅ Django is installed${NC}"
    python manage.py --version
else
    echo -e "${RED}❌ Django not found${NC}"
fi

# Check migrations
echo ""
echo "Checking migrations..."
python manage.py showmigrations --plan | head -10 || echo -e "${YELLOW}⚠️  Could not check migrations${NC}"

cd ../..

# Test 2: Frontend Build
echo ""
echo "2️⃣  Testing Frontend Build..."
echo "----------------------------------------"
cd apps/frontend

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Node modules installed${NC}"
else
    echo -e "${YELLOW}⚠️  Node modules not found${NC}"
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Test build
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend builds successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    echo "Running build with output..."
    npm run build
fi

cd ../..

# Test 3: Run Backend Tests
echo ""
echo "3️⃣  Running Backend Tests..."
echo "----------------------------------------"
cd apps/backend
source venv/bin/activate 2>/dev/null || true

# Run a simple test
if python manage.py test --noinput 2>&1 | head -30; then
    echo -e "${GREEN}✅ Backend tests completed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests may have failed or no tests found${NC}"
fi

cd ../..

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "Backend:"
echo "  cd apps/backend"
echo "  source venv/bin/activate"
echo "  python manage.py migrate"
echo "  python manage.py runserver"
echo ""
echo "Frontend:"
echo "  cd apps/frontend"
echo "  npm run dev"
echo ""
echo "Then access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000/api"
echo "  API Docs: http://localhost:8000/api/docs/"
echo ""

