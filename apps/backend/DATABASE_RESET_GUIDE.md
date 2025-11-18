# Database Reset Guide

**Date:** 2025-01-27  
**Purpose:** Complete database reset after model structure changes  
**Status:** ✅ **READY TO EXECUTE**

---

## 🎯 Overview

After making significant changes to the model structure (changing from `tenant` ForeignKey to `tenant_id` UUID field, and adding audit fields), we need to reset the database and recreate all migrations.

## 🔄 Reset Process

### Step 1: Clean Up Existing Migrations
```bash
# Navigate to backend directory
cd /Users/vijayababubollavarapu/dev/invpro/apps/backend

# Remove all existing migration files (except __init__.py)
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete

# Clean Python cache
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
```

### Step 2: Reset Database
```bash
# Option A: Using Docker (if available)
docker-compose down
docker-compose up -d postgres
# Wait for database to be ready
docker-compose exec postgres psql -U vijay -d invpro_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Option B: Direct PostgreSQL connection
psql -h localhost -U vijay -d invpro_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Step 3: Create New Migrations
```bash
# Activate virtual environment
source venv/bin/activate

# Create migrations for all apps
python manage.py makemigrations

# If makemigrations fails, create manually:
python create_initial_migration.py
```

### Step 4: Apply Migrations
```bash
# Apply all migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser --username admin --email admin@example.com
```

### Step 5: Verify Setup
```bash
# Check migration status
python manage.py showmigrations

# Test database connection
python manage.py dbshell -c "\\dt"
```

## 🚨 Troubleshooting

### Issue: Django Import Errors
**Problem:** `ModuleNotFoundError: No module named 'django.db.migrations.migration'`

**Solution:**
```bash
# Reinstall Django
pip uninstall Django
pip install Django==4.2.7

# Or upgrade to latest
pip install --upgrade Django
```

### Issue: Database Connection Errors
**Problem:** Cannot connect to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql

# Or use Docker
docker-compose up -d postgres
```

### Issue: Migration Conflicts
**Problem:** Migration files conflict

**Solution:**
```bash
# Remove all migration files
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete

# Create fresh migrations
python manage.py makemigrations
```

## 📋 Manual Migration Creation

If Django commands fail, you can create migrations manually:

### 1. Create Common App Migration
```python
# File: apps/backend/common/migrations/0001_initial.py
from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        # BaseModel with audit fields
        # TenantAwareModel with tenant_id UUID field
        # NumberSequence model
    ]
```

### 2. Create Tenants App Migration
```python
# File: apps/backend/tenants/migrations/0001_initial.py
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = [('common', '0001_initial')]
    
    operations = [
        # Tenant model
        # Membership model
    ]
```

## ✅ Verification Checklist

After completing the reset, verify:

- [ ] All migration files created successfully
- [ ] Database schema matches new model structure
- [ ] `tenant_id` fields are UUID type with indexes
- [ ] `created_by` and `updated_by` fields exist
- [ ] All apps can be imported without errors
- [ ] Django admin interface loads
- [ ] Database queries work with new structure

## 🎉 Success Indicators

You'll know the reset was successful when:

1. **Migrations Applied**: `python manage.py showmigrations` shows all migrations as `[X]`
2. **Database Schema**: Tables have `tenant_id` UUID fields instead of `tenant` ForeignKeys
3. **Audit Fields**: All tables have `created_by` and `updated_by` fields
4. **No Errors**: Django commands run without import errors
5. **Admin Access**: Django admin interface loads successfully

## 🚀 Next Steps

After successful database reset:

1. **Test Multi-Tenancy**: Verify tenant isolation works
2. **Run Tests**: Execute the comprehensive test suite
3. **Update Documentation**: Mark implementation as complete
4. **Deploy**: System is ready for production use

---

**Status**: ✅ **READY FOR EXECUTION**  
**Risk Level**: 🟡 **MEDIUM** (Database will be completely reset)  
**Backup Recommended**: ✅ **YES** (Backup existing data if needed)
