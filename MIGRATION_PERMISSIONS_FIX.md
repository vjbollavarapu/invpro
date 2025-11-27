# Migration Permissions Fix Guide

## Issue

When running `python manage.py makemigrations` on the production server, you encountered:

```
PermissionError: [Errno 13] Permission denied: '/var/www/python/invpro/shopify_integration/migrations/0003_alter_shopifyintegration_api_version.py'
```

This happens because the Django process doesn't have write permissions to the migrations directory.

## Root Cause

In production environments, files are often owned by a different user (e.g., the deployer or root) than the user running the Django application (e.g., `www-data` or a service user). The migrations directory needs write permissions for Django to create new migration files.

## ✅ Solution

### Option 1: Fix Permissions (Recommended for Production)

This allows Django to create migrations in the future without manual intervention.

```bash
# On production server
cd /var/www/python/invpro

# Find out who owns the files and who runs Django
ls -la apps/backend/shopify_integration/migrations/
ps aux | grep python | grep manage.py

# Option A: Make migrations directory writable by the Django user
# Replace 'www-data' with your actual Django user (check with ps aux)
sudo chown -R www-data:www-data apps/backend/shopify_integration/migrations/
sudo chmod -R 775 apps/backend/shopify_integration/migrations/

# Option B: Add write permissions to the group
sudo chmod -R g+w apps/backend/shopify_integration/migrations/

# Option C: Make the entire backend directory writable (less secure)
sudo chmod -R 775 apps/backend/
```

### Option 2: Create Migration File Manually

If you can't change permissions immediately, create the migration file manually:

```bash
# On production server
cd /var/www/python/invpro/apps/backend

# Create the migration file with proper ownership
sudo nano shopify_integration/migrations/0004_alter_shopifyintegration_api_version.py
```

Then paste the migration content (see below) and save.

After creating the file:

```bash
# Fix ownership
sudo chown www-data:www-data shopify_integration/migrations/0004_alter_shopifyintegration_api_version.py
sudo chmod 644 shopify_integration/migrations/0004_alter_shopifyintegration_api_version.py

# Run migrations
source venv/bin/activate
python manage.py migrate
```

### Option 3: Run makemigrations as the file owner

If you have sudo access and the files are owned by a different user:

```bash
# On production server
cd /var/www/python/invpro/apps/backend

# Find the file owner
OWNER=$(stat -c '%U' shopify_integration/migrations/)

# Run makemigrations as that user
sudo -u $OWNER source venv/bin/activate && python manage.py makemigrations

# Then run migrations as Django user
source venv/bin/activate
python manage.py migrate
```

## 📋 Step-by-Step Fix (Recommended)

### Step 1: Identify Users

```bash
# Check who owns the files
ls -la apps/backend/shopify_integration/migrations/

# Check who runs Django
ps aux | grep "python.*manage.py" | head -1
```

### Step 2: Fix Permissions

```bash
cd /var/www/python/invpro

# Make migrations directory writable
# Replace 'www-data' with your Django user
sudo chown -R www-data:www-data apps/backend/*/migrations/
sudo chmod -R 775 apps/backend/*/migrations/

# Verify
ls -la apps/backend/shopify_integration/migrations/
```

### Step 3: Create Missing Migration (If Needed)

The migration file `0004_alter_shopifyintegration_api_version.py` has been created in the repository. If it doesn't exist on production:

```bash
cd /var/www/python/invpro/apps/backend

# Pull latest code
git pull origin main

# Or create manually (see migration content below)
```

### Step 4: Run Migrations

```bash
cd /var/www/python/invpro/apps/backend
source venv/bin/activate

# Check migration status
python manage.py showmigrations shopify_integration

# Run migrations
python manage.py migrate

# Verify
python manage.py showmigrations shopify_integration
```

## 🔒 Security Best Practices

For production, follow these security practices:

1. **Don't make entire directories world-writable:**
   ```bash
   # ❌ Bad
   sudo chmod -R 777 apps/backend/
   
   # ✅ Good
   sudo chmod -R 775 apps/backend/*/migrations/
   ```

2. **Use proper ownership:**
   ```bash
   # Set ownership to Django user
   sudo chown -R www-data:www-data apps/backend/*/migrations/
   ```

3. **Consider a deployment user:**
   ```bash
   # Create a deployment group
   sudo groupadd deployment
   sudo usermod -a -G deployment www-data
   sudo usermod -a -G deployment deployer
   sudo chgrp -R deployment apps/backend/*/migrations/
   sudo chmod -R 775 apps/backend/*/migrations/
   ```

## 🚨 Troubleshooting

### Issue: Still getting permission errors after fixing

```bash
# Check actual permissions
ls -la apps/backend/shopify_integration/migrations/

# Check if SELinux is blocking (if on RHEL/CentOS)
getenforce
# If enforcing, you may need to set SELinux context
sudo chcon -R -t httpd_sys_rw_content_t apps/backend/*/migrations/
```

### Issue: Migration file exists but Django doesn't see it

```bash
# Clear Python cache
find apps/backend -name "*.pyc" -delete
find apps/backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Restart Django (if using systemd)
sudo systemctl restart your-django-service
```

### Issue: Can't determine Django user

```bash
# Check running processes
ps aux | grep python

# Check systemd service (if applicable)
sudo systemctl status your-django-service | grep User

# Check gunicorn/uwsgi config
sudo cat /etc/systemd/system/your-django-service.service | grep User
```

## ✅ Verification

After fixing permissions:

```bash
cd /var/www/python/invpro/apps/backend
source venv/bin/activate

# Test makemigrations (should work now)
python manage.py makemigrations --dry-run

# Check migration status
python manage.py showmigrations shopify_integration

# Should show:
# [X] 0001_initial
# [X] 0002_initial
# [X] 0003_add_error_count
# [ ] 0004_alter_shopifyintegration_api_version  (if not applied yet)

# Run migrations
python manage.py migrate

# Verify all applied
python manage.py showmigrations shopify_integration
```

## 📝 Migration File Content

If you need to create the migration file manually, here's the content:

**File:** `apps/backend/shopify_integration/migrations/0004_alter_shopifyintegration_api_version.py`

```python
# Generated by Django 5.1.1 on 2025-01-27

from django.db import migrations, models


def get_default_api_version():
    """Get default API version from environment or use default."""
    import os
    return os.getenv("SHOPIFY_API_VERSION", "2024-10")


class Migration(migrations.Migration):

    dependencies = [
        ('shopify_integration', '0003_add_error_count'),
    ]

    operations = [
        migrations.AlterField(
            model_name='shopifyintegration',
            name='api_version',
            field=models.CharField(
                default=get_default_api_version,
                help_text='Shopify API version used for requests',
                max_length=20
            ),
        ),
    ]
```

## 🔄 Prevention

To prevent this issue in the future:

1. **Set proper permissions during deployment:**
   ```bash
   # In your deployment script
   sudo chown -R www-data:www-data /var/www/python/invpro/apps/backend/*/migrations/
   sudo chmod -R 775 /var/www/python/invpro/apps/backend/*/migrations/
   ```

2. **Use a deployment user with proper group membership:**
   ```bash
   # Create deployment group
   sudo groupadd deployment
   sudo usermod -a -G deployment www-data
   sudo usermod -a -G deployment deployer
   
   # Set group ownership
   sudo chgrp -R deployment /var/www/python/invpro/apps/backend/*/migrations/
   sudo chmod -R 775 /var/www/python/invpro/apps/backend/*/migrations/
   ```

3. **Run makemigrations in CI/CD, not on production:**
   - Generate migrations in development/CI
   - Commit migration files to git
   - Deploy migration files with code
   - Only run `migrate` on production (not `makemigrations`)

---

**Note:** The migration file `0004_alter_shopifyintegration_api_version.py` has been added to the repository. After pulling the latest code, you should only need to fix permissions and run `python manage.py migrate`.

