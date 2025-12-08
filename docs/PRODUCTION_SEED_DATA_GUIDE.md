# Production Seed Data Guide

This guide explains how to seed your production database with initial data for testing and demonstration.

## 🚀 Quick Start

### Option 1: Using Django Management Command (Recommended)

```bash
# On production server
cd /var/www/python/invpro/apps/backend
source venv/bin/activate

# Seed all data (general + pharmacy)
python manage.py seed_data

# Or seed specific types
python manage.py seed_data --type=general    # General inventory data only
python manage.py seed_data --type=pharmacy   # Pharmacy data only
python manage.py seed_data --type=all        # All data (default)
```

### Option 2: Using Existing Seed Scripts

```bash
# On production server
cd /var/www/python/invpro/apps/backend
source venv/bin/activate

# Seed general data
python manage.py shell < seed_data.py

# Seed pharmacy data (if needed)
python manage.py shell < seed_pharmacy_data.py
```

## 📊 What Gets Created

### General Data (--type=general)

- **2 Tenants:**
  - Demo Manufacturing Co
  - Test Wholesale Inc

- **3 Users:**
  - `demo@example.com` / `Demo123456` (Admin for Tenant 1)
  - `test@example.com` / `Test123456` (Admin for Tenant 2)
  - `multi@example.com` / `Multi123456` (Multi-tenant user)

- **Data per Tenant:**
  - 2-3 Warehouses
  - 3 Suppliers
  - 8 Products (various stock levels)
  - 5 Customers
  - 5 Sales Orders
  - 3 Purchase Orders
  - 4 Purchase Requests
  - 5 Cost Centers
  - 7 Expenses
  - Stock Movements
  - Warehouse Transfers

### Pharmacy Data (--type=pharmacy)

- **1 Pharmacy Tenant:**
  - Demo Pharmacy (industry: pharmacy)

- **1 User:**
  - `pharmacist@demo.com` / `Pharma123456`

- **Pharmacy Data:**
  - Drug Products with packaging levels
  - Drug Batches (with expiry tracking)
  - Inventory records

## 🔑 Default Login Credentials

After seeding, you can login with:

### General Inventory

**Tenant 1 (Demo Manufacturing Co):**
- Email: `demo@example.com`
- Password: `Demo123456`
- Role: Admin

**Tenant 2 (Test Wholesale Inc):**
- Email: `test@example.com`
- Password: `Test123456`
- Role: Admin

**Multi-Tenant User:**
- Email: `multi@example.com`
- Password: `Multi123456`
- Access: Both tenants (can switch)

### Pharmacy

**Pharmacy Tenant:**
- Email: `pharmacist@demo.com`
- Password: `Pharma123456`
- Role: Admin

## ⚠️ Important Notes

### 1. Safe to Run Multiple Times

The seed command uses `get_or_create()` which means:
- ✅ Safe to run multiple times
- ✅ Won't create duplicates
- ✅ Updates existing records if needed

### 2. Production Considerations

- **Change Passwords:** After seeding, change default passwords in production
- **Review Data:** Check that seeded data matches your requirements
- **Tenant IDs:** Note the tenant IDs for API testing

### 3. Customization

To customize the seed data:

1. Edit `apps/backend/common/management/commands/seed_data.py`
2. Modify the data arrays (products, customers, etc.)
3. Run the command again

## 🧪 Testing After Seeding

### 1. Test Login

```bash
# Test login API
curl -X POST https://api.mangostack.io/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123456"
  }'
```

### 2. Test API Endpoints

```bash
# Get products (replace TOKEN with actual token)
curl https://api.mangostack.io/api/inventory/products/ \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

### 3. Test Frontend

1. Login with `demo@example.com` / `Demo123456`
2. Navigate to Dashboard
3. Check that data appears:
   - Products list
   - Orders
   - Customers
   - Suppliers

## 🔄 Re-seeding Data

If you need to reset and re-seed:

### Option 1: Delete and Re-seed (Careful!)

```bash
# WARNING: This deletes all data!
python manage.py shell << EOF
from tenants.models import Tenant
from users.models import User
# Delete specific tenants (be careful!)
# Tenant.objects.filter(code='demo-manufacturing').delete()
EOF

# Then re-seed
python manage.py seed_data
```

### Option 2: Update Existing Data

The seed command will update existing records. Just run it again:

```bash
python manage.py seed_data
```

## 📝 Custom Seed Data

To create your own seed data:

1. **Create a new management command:**
   ```bash
   # Create file: apps/backend/common/management/commands/seed_custom.py
   ```

2. **Or modify existing:**
   ```bash
   # Edit: apps/backend/common/management/commands/seed_data.py
   ```

3. **Add your data:**
   ```python
   # Add your products, customers, etc.
   product_data = [
       ("Your Product", "SKU-001", "Category", "unit", qty, reorder, cost, price),
   ]
   ```

## 🐛 Troubleshooting

### Issue: Command not found

```bash
# Make sure you're in the backend directory
cd /var/www/python/invpro/apps/backend

# Activate virtual environment
source venv/bin/activate

# Verify Django is installed
python manage.py --help
```

### Issue: Import errors

```bash
# Make sure all apps are in INSTALLED_APPS
# Check: apps/backend/backend/settings.py

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database errors

```bash
# Check migrations are applied
python manage.py showmigrations

# Apply migrations if needed
python manage.py migrate
```

### Issue: Duplicate data

The seed command uses `get_or_create()` so duplicates shouldn't happen. If you see duplicates:

1. Check for existing data before seeding
2. Use `--skip-existing` flag (if implemented)
3. Manually delete specific records if needed

## ✅ Verification

After seeding, verify data was created:

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

## 📞 Next Steps

After seeding:

1. ✅ Test login with seeded credentials
2. ✅ Verify data appears in frontend
3. ✅ Test API endpoints
4. ✅ Change default passwords (in production)
5. ✅ Create additional users as needed

---

**Note:** The seed data is designed for testing and demonstration. For production, consider:
- Using more realistic data
- Setting stronger passwords
- Limiting seed data to development/staging environments

