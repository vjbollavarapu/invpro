# Quick Seed Data Guide

## 🚀 One-Line Command

```bash
cd /var/www/python/invpro/apps/backend && source venv/bin/activate && python manage.py seed_data
```

## 📋 Step-by-Step

```bash
# 1. Navigate to backend
cd /var/www/python/invpro/apps/backend

# 2. Activate virtual environment
source venv/bin/activate

# 3. Seed data
python manage.py seed_data
```

## 🔑 Login Credentials (After Seeding)

**General Inventory:**
- Email: `demo@example.com` / Password: `Demo123456`
- Email: `test@example.com` / Password: `Test123456`

**Pharmacy:**
- Email: `pharmacist@demo.com` / Password: `Pharma123456`

## ✅ Verify It Worked

```bash
python manage.py shell << EOF
from tenants.models import Tenant
from users.models import User
from inventory.models import Product
print(f"Tenants: {Tenant.objects.count()}")
print(f"Users: {User.objects.count()}")
print(f"Products: {Product.objects.count()}")
EOF
```

## 📚 Full Guide

See `PRODUCTION_SEED_DATA_GUIDE.md` for detailed instructions.

