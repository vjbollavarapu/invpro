# InvPro360 API Reference

**Base URL:** `http://localhost:8000/api/`  
**Authentication:** JWT Bearer Token  
**Multi-Tenancy:** Required `X-Tenant-ID` header  

---

## 🔐 Authentication Endpoints

### POST `/api/auth/register/`
Register a new user.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "password2": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### POST `/api/auth/login/`
Login user and get JWT tokens.

**Request:**
```json
{
  "username": "johndoe",  // or "email": "john@example.com"
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "tenants": [
      {
        "tenant_id": 1,
        "tenant_name": "Demo Company",
        "tenant_code": "demo",
        "role": "admin"
      }
    ]
  }
}
```

### POST `/api/token/refresh/`
Refresh access token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 📦 Inventory Endpoints

**Headers Required:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: 1
```

### GET `/api/inventory/products/`
List all products.

**Query Params:**
- `category`: Filter by category
- `status`: Filter by status
- `supplier`: Filter by supplier ID
- `search`: Search in name, SKU, description
- `ordering`: Sort by field (e.g., `-created_at`)
- `page`: Page number

**Response:** `200 OK`
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "product_code": "PRD-001",
      "sku": "ISP-2024-001",
      "name": "Industrial Steel Pipes",
      "description": "",
      "category": "Raw Materials",
      "unit": "pcs",
      "unit_cost": "45.99",
      "selling_price": "65.00",
      "quantity": 450,
      "reorder_level": 100,
      "status": "active",
      "supplier": 1,
      "supplier_name": "Global Supplies",
      "supplier_code": "SUP-001",
      "total_value": "20695.50",
      "stock_status": "in-stock",
      "created_at": "2025-10-13T10:30:00Z",
      "updated_at": "2025-10-13T10:30:00Z"
    }
  ]
}
```

### POST `/api/inventory/products/`
Create a new product.

**Request:**
```json
{
  "sku": "NEW-001",
  "name": "New Product",
  "description": "Product description",
  "category": "Equipment",
  "unit": "pcs",
  "unit_cost": "100.00",
  "selling_price": "150.00",
  "quantity": 50,
  "reorder_level": 10,
  "status": "active",
  "supplier": 1
}
```

**Response:** `201 Created` (auto-generates `product_code`)

### GET `/api/inventory/products/{id}/`
Get single product.

### PUT/PATCH `/api/inventory/products/{id}/`
Update product.

### DELETE `/api/inventory/products/{id}/`
Delete product.

### POST `/api/inventory/products/{id}/adjust_stock/`
Adjust stock level.

**Request:**
```json
{
  "adjustment_type": "add",  // "add", "remove", or "set"
  "quantity": 100,
  "warehouse_id": 1,  // optional
  "reason": "Received shipment from supplier"
}
```

### GET `/api/inventory/stock-movements/`
List stock movement history (read-only).

---

## 💼 Sales Endpoints

### GET `/api/sales/customers/`
List all customers.

### POST `/api/sales/customers/`
Create customer (auto-generates `customer_code`).

### GET `/api/sales/orders/`
List all orders.

**Query Params:**
- `status`: pending, processing, shipped, delivered, cancelled
- `channel`: manual, shopify
- `customer`: Filter by customer ID

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "order_number": "ORD-2024-001",
      "customer": 1,
      "customer_name": "Acme Corp",
      "customer_email": "orders@acme.com",
      "channel": "shopify",
      "total_amount": "15420.50",
      "status": "delivered",
      "fulfilled_at": "2025-10-13T15:30:00Z",
      "items": [
        {
          "id": 1,
          "product": 1,
          "product_name": "Industrial Pump",
          "product_code": "PRD-001",
          "quantity": 5,
          "price": "250.00",
          "total": "1250.00"
        }
      ],
      "items_count": 2,
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

### POST `/api/sales/orders/`
Create order with items.

**Request:**
```json
{
  "customer": 1,
  "channel": "manual",
  "items": [
    {"product": 1, "quantity": 5, "price": "250.00"},
    {"product": 2, "quantity": 3, "price": "180.00"}
  ]
}
```

### POST `/api/sales/orders/{id}/fulfill/`
Mark order as fulfilled.

### POST `/api/sales/orders/{id}/cancel/`
Cancel an order.

---

## 🛒 Procurement Endpoints

### GET `/api/procurement/suppliers/`
List suppliers.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "supplier_code": "SUP-001",
      "name": "Global Supplies Inc",
      "contact_person": "James Wilson",
      "email": "james@global.com",
      "phone": "+1-555-123-4567",
      "address": "123 Industrial Blvd",
      "rating": "4.8",
      "total_orders": 156,
      "active_orders": 3
    }
  ]
}
```

### GET `/api/procurement/requests/`
List purchase requests.

### POST `/api/procurement/requests/`
Create purchase request (auto-sets `requested_by` to current user).

### POST `/api/procurement/requests/{id}/approve/`
Approve a purchase request.

### POST `/api/procurement/requests/{id}/reject/`
Reject a purchase request.

### GET `/api/procurement/orders/`
List purchase orders.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "po_number": "PO-2024-001",
      "supplier": 1,
      "supplier_name": "Global Supplies Inc",
      "supplier_code": "SUP-001",
      "total_amount": "45250.00",
      "expected_delivery_date": "2025-11-01",
      "status": "pending",
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

---

## 🏭 Warehouse Endpoints

### GET `/api/warehouse/warehouses/`
List warehouses.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "warehouse_code": "WH-001",
      "name": "Central Distribution Center",
      "location": "New York, NY",
      "max_capacity": 1000,
      "current_utilization": 850,
      "capacity_percentage": 85,
      "active_clients": 12,
      "total_skus": 2450,
      "status": "active"
    }
  ]
}
```

### GET `/api/warehouse/transfers/`
List warehouse transfers.

### POST `/api/warehouse/transfers/`
Create warehouse transfer.

**Request:**
```json
{
  "from_warehouse": 1,
  "to_warehouse": 2,
  "product": 1,
  "quantity": 50,
  "status": "pending"
}
```

---

## 💰 Finance Endpoints

### GET `/api/finance/cost-centers/`
List cost centers.

### GET `/api/finance/cost-centers/summary/`
Get cost center summary statistics.

**Response:**
```json
{
  "total_budget": 650000.00,
  "total_actual_cost": 657000.00,
  "total_variance": 7000.00,
  "variance_percentage": 1.08,
  "cost_center_count": 5
}
```

### GET `/api/finance/expenses/`
List expenses.

### GET `/api/finance/expenses/by_category/`
Get expenses grouped by category.

**Response:**
```json
[
  {"category": "Facilities", "total": "45000.00"},
  {"category": "Logistics", "total": "38000.00"},
  {"category": "Operations", "total": "28000.00"}
]
```

---

## 👥 User & Tenant Endpoints

### GET `/api/users/me/`
Get current user info.

### POST `/api/users/change_password/`
Change user password.

**Request:**
```json
{
  "old_password": "OldPass123",
  "new_password": "NewPass456",
  "new_password2": "NewPass456"
}
```

### GET `/api/tenants/`
List tenants user belongs to.

### GET `/api/tenants/{id}/members/`
Get all members of a tenant.

### POST `/api/tenants/{id}/add_member/`
Add member to tenant.

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "staff"
}
```

---

## 🔔 Notification Endpoints

### GET `/api/notifications/`
List user's notifications.

### POST `/api/notifications/{id}/mark_read/`
Mark notification as read.

### POST `/api/notifications/mark_all_read/`
Mark all notifications as read.

---

## 📖 API Documentation

Interactive API documentation available at:

- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`
- **OpenAPI Schema:** `http://localhost:8000/api/schema/`

---

## 🔑 Authentication Flow

### 1. Register or Login
```bash
POST /api/auth/login/
{
  "username": "user",
  "password": "pass"
}

# Returns access & refresh tokens
```

### 2. Use Access Token
```bash
GET /api/inventory/products/
Headers:
  Authorization: Bearer <access_token>
  X-Tenant-ID: 1
```

### 3. Refresh Token When Expired
```bash
POST /api/token/refresh/
{
  "refresh": "<refresh_token>"
}

# Returns new access_token
```

---

## 🌐 Multi-Tenant Headers

**All requests (except auth) must include:**

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
X-Tenant-ID: 1
```

Without `X-Tenant-ID`, the API will return empty results (security by default).

---

## 📊 Response Format

### Success Response
```json
{
  "count": 10,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error Response
```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

---

## 🚀 Quick Start Example

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Add auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

// Login
const login = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  localStorage.setItem('tenant_id', response.data.user.tenants[0].tenant_id);
  return response.data;
};

// Get products
const getProducts = async () => {
  const response = await api.get('/inventory/products/');
  return response.data.results;
};

// Create order
const createOrder = async (orderData) => {
  const response = await api.post('/sales/orders/', orderData);
  return response.data;
};
```

---

## 🔍 Filtering & Search

### Filter by Field
```
GET /api/inventory/products/?category=Equipment&status=active
```

### Search
```
GET /api/inventory/products/?search=pump
```

### Ordering
```
GET /api/inventory/products/?ordering=-created_at  // Newest first
GET /api/inventory/products/?ordering=name  // Alphabetical
```

### Pagination
```
GET /api/inventory/products/?page=2&page_size=50
```

---

## 📝 Field Formats

### Dates
- Format: `YYYY-MM-DD`
- Example: `2025-10-13`

### DateTimes
- Format: `YYYY-MM-DDTHH:MM:SSZ`
- Example: `2025-10-13T14:30:00Z`

### Decimals
- Format: String with 2 decimal places
- Example: `"1250.50"`

### Auto-Generated Codes
- Products: `PRD-001`, `PRD-002`
- Orders: `ORD-001`, `ORD-2024-001`
- Purchase Orders: `PO-001`, `PO-2024-001`
- Warehouses: `WH-001`, `WH-002`

---

*Last Updated: October 13, 2025*
*Version: 1.0.0*

