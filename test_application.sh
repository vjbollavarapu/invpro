#!/bin/bash

# Comprehensive Application Test Script
# Tests both backend and frontend

set -e

echo "=========================================="
echo "InvPro360 Application Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Test 1: Check Docker services
echo "1️⃣  Testing Docker Services..."
echo "----------------------------------------"
if docker-compose ps | grep -q "Up"; then
    print_status 0 "Docker services are running"
    docker-compose ps
else
    print_status 1 "Docker services not running"
    echo "Starting Docker services..."
    docker-compose up -d
    sleep 10
fi
echo ""

# Test 2: Backend Health Check
echo "2️⃣  Testing Backend Health..."
echo "----------------------------------------"
BACKEND_URL="http://localhost:8000/api"
if curl -s -f "$BACKEND_URL/" > /dev/null 2>&1; then
    print_status 0 "Backend is responding"
    echo "Backend URL: $BACKEND_URL"
else
    print_status 1 "Backend is not responding"
    echo "Attempting to start backend..."
    cd apps/backend
    if [ -d "venv" ]; then
        source venv/bin/activate
        python manage.py runserver 8000 &
        sleep 5
    fi
    cd ../..
fi
echo ""

# Test 3: Frontend Health Check
echo "3️⃣  Testing Frontend Health..."
echo "----------------------------------------"
FRONTEND_URL="http://localhost:3000"
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    print_status 0 "Frontend is responding"
    echo "Frontend URL: $FRONTEND_URL"
else
    print_status 1 "Frontend is not responding"
    echo "To start frontend: cd apps/frontend && npm run dev"
fi
echo ""

# Test 4: Database Connection
echo "4️⃣  Testing Database Connection..."
echo "----------------------------------------"
if docker-compose exec -T db psql -U invpro_user -d invpro_db -c "SELECT 1;" > /dev/null 2>&1; then
    print_status 0 "Database connection successful"
else
    print_status 1 "Database connection failed"
fi
echo ""

# Test 5: Backend API Endpoints
echo "5️⃣  Testing Backend API Endpoints..."
echo "----------------------------------------"
ENDPOINTS=(
    "/api/"
    "/api/docs/"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -s -f "$BACKEND_URL$endpoint" > /dev/null 2>&1; then
        print_status 0 "Endpoint $endpoint is accessible"
    else
        print_status 1 "Endpoint $endpoint is not accessible"
    fi
done
echo ""

# Test 6: Run Backend Tests (if available)
echo "6️⃣  Running Backend Unit Tests..."
echo "----------------------------------------"
if [ -d "apps/backend" ]; then
    cd apps/backend
    if [ -d "venv" ]; then
        source venv/bin/activate
        if python manage.py test --noinput 2>&1 | head -20; then
            print_status 0 "Backend tests completed"
        else
            print_status 1 "Backend tests failed or no tests found"
        fi
    else
        echo -e "${YELLOW}⚠️  Virtual environment not found. Skipping backend tests.${NC}"
    fi
    cd ../..
else
    print_status 1 "Backend directory not found"
fi
echo ""

# Test 7: Frontend Build Test
echo "7️⃣  Testing Frontend Build..."
echo "----------------------------------------"
if [ -d "apps/frontend" ]; then
    cd apps/frontend
    if npm run build > /dev/null 2>&1; then
        print_status 0 "Frontend builds successfully"
    else
        print_status 1 "Frontend build failed"
    fi
    cd ../..
else
    print_status 1 "Frontend directory not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Backend: http://localhost:8000/api"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/api/docs/"
echo ""
echo "To start services manually:"
echo "  docker-compose up -d"
echo "  cd apps/backend && python manage.py runserver"
echo "  cd apps/frontend && npm run dev"
echo ""

