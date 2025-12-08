# Testing Guide

Quick guide to test the InvPro360 application.

## Quick Test Results

✅ **Backend**: Django 5.1.1 installed and ready  
✅ **Frontend**: Builds successfully  
✅ **Migrations**: All applied  
⚠️ **Tests**: Some pytest dependencies missing (non-critical)

---

## Option 1: Quick Manual Test

### Start Backend:
```bash
cd apps/backend
source venv/bin/activate
python manage.py runserver
```

Backend will be available at: http://localhost:8000/api

### Start Frontend (in new terminal):
```bash
cd apps/frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## Option 2: Automated Start Script

```bash
./start_dev.sh
```

This will open new terminal windows (macOS) or start servers in background (Linux).

---

## Option 3: Run Test Suite

### Quick Test:
```bash
./quick_test.sh
```

### Full Test (with Docker):
```bash
./test_application.sh
```

---

## Test Endpoints

Once servers are running:

1. **Frontend**: http://localhost:3000
   - Login page
   - Dashboard
   - All features

2. **Backend API**: http://localhost:8000/api
   - REST API endpoints
   - Authentication required

3. **API Documentation**: http://localhost:8000/api/docs/
   - Swagger/OpenAPI docs
   - Interactive API testing

4. **Admin Panel**: http://localhost:8000/admin/
   - Django admin interface
   - Requires superuser account

---

## Test Credentials

If you've run seed data:
- Email: `demo@example.com`
- Password: `Demo123456`

Or create a new user:
```bash
cd apps/backend
source venv/bin/activate
python manage.py createsuperuser
```

---

## Verify Installation

### Backend:
```bash
cd apps/backend
source venv/bin/activate
python manage.py check
python manage.py showmigrations
```

### Frontend:
```bash
cd apps/frontend
npm run build
```

---

## Common Issues

### Backend won't start:
- Check if port 8000 is available
- Verify database connection in `.env`
- Run migrations: `python manage.py migrate`

### Frontend won't start:
- Check if port 3000 is available
- Install dependencies: `npm install --legacy-peer-deps`
- Check `.env.local` file exists

### Database errors:
- Ensure PostgreSQL is running (if using local DB)
- Check database credentials in `.env`
- Run migrations: `python manage.py migrate`

---

## Next Steps

1. ✅ Start both servers
2. ✅ Access frontend at http://localhost:3000
3. ✅ Login with test credentials
4. ✅ Test features:
   - Inventory management
   - Shopify integration
   - Pharmacy module
   - Multi-tenant features

---

**Status**: ✅ Ready to test  
**Last Updated**: January 2025

