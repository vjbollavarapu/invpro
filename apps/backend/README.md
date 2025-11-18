# InvPro360 Backend

Multi-tenant Inventory & Procurement Management System API

---

## 🚀 Quick Start

### 1. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 2. Install Dependencies (if needed)
```bash
pip install -r requirements.txt
```

### 3. Apply Migrations (if needed)
```bash
python manage.py migrate
```

### 4. Create Superuser (optional)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver 8000
```

Server will start at: `http://localhost:8000/`

---

## 📚 API Documentation

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **Admin Panel:** http://localhost:8000/admin/

---

## 🔑 Quick Test

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "password2": "TestPass123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

### 3. Use API (with token)
```bash
curl http://localhost:8000/api/inventory/products/ \
  -H "Authorization: Bearer <your_access_token>" \
  -H "X-Tenant-ID: 1"
```

---

## 🎯 Features

✅ Multi-tenant architecture (row-based)  
✅ JWT authentication  
✅ Auto-number generation (PRD-001, PO-2024-001, etc.)  
✅ Complete CRUD APIs for all entities  
✅ Search, filter, pagination  
✅ PostgreSQL database  
✅ CORS configured for frontend  

---

## 📦 Main Entities

- **Inventory:** Products, Stock Movements
- **Sales:** Customers, Orders, Order Items
- **Procurement:** Suppliers, Purchase Requests, Purchase Orders
- **Warehouse:** Warehouses, Transfers
- **Finance:** Cost Centers, Expenses
- **Users:** Users, Tenants, Memberships
- **Notifications:** User Notifications

---

## 🔧 Environment Variables

Create `.env` file with:

```env
SECRET_KEY=your-secret-key
DEBUG=1
ALLOWED_HOSTS=*

POSTGRES_DB=invpro_db
POSTGRES_USER=vijay
POSTGRES_PASSWORD=
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 📖 Full Documentation

See `/docs/` folder for complete documentation:
- API_REFERENCE.md
- BACKEND_COMPLETION_REPORT.md
- MODEL_COMPARISON_ANALYSIS.md
- And more...

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** October 13, 2025

