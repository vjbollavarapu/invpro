# Migration Conflict Fix Guide

## Issue

When deploying, you encountered:
```
CommandError: Conflicting migrations detected; multiple leaf nodes in the migration graph: (0002_add_error_count, 0002_initial in shopify_integration).
```

## Root Cause

Two migration files had the same number `0002`:
- `0002_initial.py` - Adds foreign keys and indexes
- `0002_add_error_count.py` - Adds error_count field

Both depended on `0001_initial`, causing a conflict.

## ✅ Solution Applied

1. **Renamed migration file:**
   - `0002_add_error_count.py` → `0003_add_error_count.py`

2. **Updated dependencies:**
   - Changed dependency from `0001_initial` to `0002_initial`

3. **Added missing dependency:**
   - Added `requests==2.32.3` to `requirements.txt`

## 📋 Migration Order (Fixed)

```
0001_initial.py          (Creates all models)
    ↓
0002_initial.py          (Adds foreign keys, indexes)
    ↓
0003_add_error_count.py  (Adds error_count field)
```

## 🔧 For Production Server

If you've already run migrations and hit this error, you have two options:

### Option 1: Delete Conflicting Migration (If Not Applied Yet)

```bash
# On production server
cd /var/www/invpro/apps/backend

# Check which migrations are applied
python manage.py showmigrations shopify_integration

# If 0002_add_error_count is NOT applied, delete it
rm shopify_integration/migrations/0002_add_error_count.py

# Pull the fixed version
git pull origin main

# Run migrations
python manage.py migrate
```

### Option 2: Create Merge Migration (If Both Are Applied)

```bash
# On production server
cd /var/www/invpro/apps/backend

# Create merge migration
python manage.py makemigrations --merge shopify_integration

# This will create a merge migration file
# Review it, then:
python manage.py migrate
```

### Option 3: Fresh Start (If Database is Empty)

```bash
# On production server
cd /var/www/invpro/apps/backend

# Pull latest code
git pull origin main

# Run migrations (should work now)
python manage.py migrate
```

## 📦 Install Missing Dependencies

```bash
# On production server
cd /var/www/invpro/apps/backend
source venv/bin/activate

# Install requests
pip install requests==2.32.3

# Or update requirements.txt and install all
pip install -r requirements.txt
```

## ✅ Verification

After fixing, verify migrations:

```bash
# Check migration status
python manage.py showmigrations shopify_integration

# Should show:
# [X] 0001_initial
# [X] 0002_initial
# [X] 0003_add_error_count

# Try running migrations
python manage.py migrate

# Should complete without errors
```

## 🔄 Updated Requirements

The `requirements.txt` now includes:
- `requests==2.32.3` - Required for Shopify API client

Make sure to install it:
```bash
pip install -r requirements.txt
```

---

## 📝 Summary

**Fixed:**
- ✅ Renamed `0002_add_error_count.py` to `0003_add_error_count.py`
- ✅ Updated dependency to `0002_initial`
- ✅ Added `requests==2.32.3` to requirements.txt

**Next Steps:**
1. Pull latest code: `git pull origin main`
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`

**Your migrations should now work correctly!** ✅

