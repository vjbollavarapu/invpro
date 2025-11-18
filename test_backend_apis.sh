#!/bin/bash

echo "🧪 Testing Backend APIs..."
echo "================================"

# Login and get token
echo -e "\n1️⃣  Testing Login API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "Demo123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access')
TENANT_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.tenants[0].tenant_id')
USER_NAME=$(echo $LOGIN_RESPONSE | jq -r '.user.first_name')

if [ "$TOKEN" != "null" ]; then
  echo "   ✅ Login successful - User: $USER_NAME, Tenant ID: $TENANT_ID"
else
  echo "   ❌ Login failed"
  exit 1
fi

# Test Products API
echo -e "\n2️⃣  Testing Products API..."
PRODUCTS=$(curl -s http://localhost:8000/api/inventory/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

PRODUCT_COUNT=$(echo $PRODUCTS | jq '.results | length')
FIRST_PRODUCT=$(echo $PRODUCTS | jq -r '.results[0].name')

if [ "$PRODUCT_COUNT" -gt 0 ]; then
  echo "   ✅ Products API working - Found $PRODUCT_COUNT products"
  echo "      First product: $FIRST_PRODUCT"
else
  echo "   ❌ No products returned"
fi

# Test Dashboard API
echo -e "\n3️⃣  Testing Dashboard API..."
DASHBOARD=$(curl -s http://localhost:8000/api/multi-tenant/dashboard/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

TOTAL_PRODUCTS=$(echo $DASHBOARD | jq -r '.metrics.total_products // "N/A"')
TOTAL_VALUE=$(echo $DASHBOARD | jq -r '.metrics.total_inventory_value // "N/A"')

if [ "$TOTAL_PRODUCTS" != "N/A" ]; then
  echo "   ✅ Dashboard API working"
  echo "      Total Products: $TOTAL_PRODUCTS"
  echo "      Total Value: \$$TOTAL_VALUE"
else
  echo "   ⚠️  Dashboard API returned data but metrics may need checking"
fi

# Test Sales Orders API
echo -e "\n4️⃣  Testing Sales Orders API..."
ORDERS=$(curl -s http://localhost:8000/api/sales/orders/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

ORDER_COUNT=$(echo $ORDERS | jq '.results | length')
FIRST_ORDER=$(echo $ORDERS | jq -r '.results[0].order_number // "N/A"')

if [ "$ORDER_COUNT" -gt 0 ]; then
  echo "   ✅ Sales Orders API working - Found $ORDER_COUNT orders"
  echo "      First order: $FIRST_ORDER"
else
  echo "   ⚠️  No orders returned (may be empty)"
fi

# Test Multi-Tenant Endpoints
echo -e "\n5️⃣  Testing Multi-Tenant APIs..."
TENANTS=$(curl -s http://localhost:8000/api/multi-tenant/my_tenants/ \
  -H "Authorization: Bearer $TOKEN")

TENANT_COUNT=$(echo $TENANTS | jq '.tenants | length')

if [ "$TENANT_COUNT" -gt 0 ]; then
  echo "   ✅ Multi-tenant API working - User has $TENANT_COUNT tenant(s)"
else
  echo "   ❌ Multi-tenant API failed"
fi

echo -e "\n================================"
echo "✅ Backend API Testing Complete!"
echo "================================"

