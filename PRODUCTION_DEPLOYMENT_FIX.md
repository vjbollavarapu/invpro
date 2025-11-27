# Production Deployment Fix - Migration Conflict & Missing Dependencies

## Issues Fixed

1. ✅ **Migration Conflict**: Two migration files with same number `0002`
2. ✅ **Missing Dependency**: `requests` library not in requirements.txt

---

## 🔧 Fixes Applied

### 1. Migration Conflict Resolution

**Problem:**
- `0002_initial.py` and `0002_add_error_count.py` both existed
- Both depended on `0001_initial`, causing conflict

**Solution:**
- Renamed `0002_add_error_count.py` → `0003_add_error_count.py`
- Updated dependency: `0001_initial` → `0002_initial`

**Migration Order (Fixed):**
```
0001_initial.py
    ↓
0002_initial.py
    ↓
0003_add_error_count.py
```

### 2. Missing Dependency

**Problem:**
- `requests` library required by Shopify API client
- Not listed in `requirements.txt`

**Solution:**
- Added `requests==2.32.3` to `requirements.txt`

---

## 🚀 Quick Fix for Production Server

### Option 1: Pull Latest Code (Recommended)

If you haven't run migrations yet or can reset:

```bash
# On production server
cd /var/www/invpro/apps/backend

# Pull latest code with fixes
git pull origin main

# Install missing dependency
source venv/bin/activate
pip install requests==2.32.3

# Or install all requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate
```

### Option 2: Manual Fix (If Already Deployed)

If you've already deployed and hit the error:

```bash
# On production server
cd /var/www/invpro/apps/backend
source venv/bin/activate

# 1. Install missing dependency
pip install requests==2.32.3

# 2. Check for conflicting migration file
ls -la shopify_integration/migrations/0002*.py

# 3. If 0002_add_error_count.py exists, remove it
rm shopify_integration/migrations/0002_add_error_count.py

# 4. Pull latest code to get 0003_add_error_count.py
git pull origin main

# 5. Verify migration files
ls -la shopify_integration/migrations/000*.py
# Should show:
# - 0001_initial.py
# - 0002_initial.py
# - 0003_add_error_count.py (NOT 0002_add_error_count.py)

# 6. Run migrations
python manage.py migrate
```

### Option 3: Create Merge Migration (If Both Applied)

If both migrations were already applied to database:

```bash
# On production server
cd /var/www/invpro/apps/backend
source venv/bin/activate

# 1. Install missing dependency
pip install requests==2.32.3

# 2. Create merge migration
python manage.py makemigrations --merge shopify_integration

# This will create a merge migration file
# Review the generated file, then:

# 3. Run migrations
python manage.py migrate
```

---

## 📋 Step-by-Step Fix

### Step 1: Install Missing Dependency

```bash
cd /var/www/invpro/apps/backend
source venv/bin/activate
pip install requests==2.32.3
```

### Step 2: Fix Migration Conflict

```bash
# Check current migration files
ls -la shopify_integration/migrations/000*.py

# If you see 0002_add_error_count.py, remove it
rm shopify_integration/migrations/0002_add_error_count.py

# Pull latest code
git pull origin main

# Verify you now have 0003_add_error_count.py
ls -la shopify_integration/migrations/000*.py
```

### Step 3: Verify Migration Files

Expected files:
```
0001_initial.py          ✅
0002_initial.py          ✅
0003_add_error_count.py  ✅ (NOT 0002_add_error_count.py)
```

### Step 4: Run Migrations

```bash
# Check migration status
python manage.py showmigrations shopify_integration

# Run migrations
python manage.py migrate

# Should complete without errors
```

---

## ✅ Verification

After fixing, verify everything works:

```bash
# 1. Check requests is installed
python -c "import requests; print(f'requests {requests.__version__}')"

# 2. Check migration status
python manage.py showmigrations shopify_integration

# Should show:
# [X] 0001_initial
# [X] 0002_initial
# [X] 0003_add_error_count

# 3. Test migrations
python manage.py migrate --check

# 4. Test Django
python manage.py check
```

---

## 🔄 Updated Files

### requirements.txt
```diff
+ requests==2.32.3
```

### Migration Files
```diff
- shopify_integration/migrations/0002_add_error_count.py
+ shopify_integration/migrations/0003_add_error_count.py
```

### Migration Dependencies
```diff
  dependencies = [
-     ('shopify_integration', '0001_initial'),
+     ('shopify_integration', '0002_initial'),
  ]
```

---

## 🎯 Summary

**Fixed Issues:**
1. ✅ Migration conflict resolved (renamed to 0003)
2. ✅ Missing `requests` dependency added

**Next Steps:**
1. Pull latest code: `git pull origin main`
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`

**Your deployment should now work!** ✅

---

## 📞 Quick Commands

```bash
# Full fix in one go
cd /var/www/invpro/apps/backend
source venv/bin/activate
git pull origin main
pip install requests==2.32.3
rm -f shopify_integration/migrations/0002_add_error_count.py
python manage.py migrate
```

