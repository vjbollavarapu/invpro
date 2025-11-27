#!/bin/bash

# Deployment Fix Script for Migration Conflicts and Missing Dependencies
# Run this on your production server if you encounter migration conflicts

set -e

echo "🔧 Fixing deployment issues..."

cd /var/www/invpro/apps/backend

# Activate virtual environment
source venv/bin/activate

# 1. Install missing dependencies
echo "📦 Installing missing dependencies..."
pip install requests==2.32.3

# Or install all requirements
# pip install -r requirements.txt

# 2. Check migration status
echo "📊 Checking migration status..."
python manage.py showmigrations shopify_integration

# 3. Fix migration conflicts
echo "🔍 Checking for migration conflicts..."

# Check if 0002_add_error_count exists (old conflicting file)
if [ -f "shopify_integration/migrations/0002_add_error_count.py" ]; then
    echo "⚠️  Found conflicting migration file: 0002_add_error_count.py"
    echo "📥 Pulling latest code to get fixed version..."
    git pull origin main
    
    # If file still exists after pull, remove it
    if [ -f "shopify_integration/migrations/0002_add_error_count.py" ]; then
        echo "🗑️  Removing conflicting migration file..."
        rm shopify_integration/migrations/0002_add_error_count.py
    fi
fi

# 4. Verify migration files
echo "✅ Verifying migration files..."
ls -la shopify_integration/migrations/000*.py

# Expected files:
# - 0001_initial.py
# - 0002_initial.py
# - 0003_add_error_count.py (NOT 0002_add_error_count.py)

# 5. Try to run migrations
echo "🚀 Running migrations..."
python manage.py migrate shopify_integration

# 6. If still conflicts, create merge migration
if [ $? -ne 0 ]; then
    echo "⚠️  Migration conflict detected. Creating merge migration..."
    python manage.py makemigrations --merge shopify_integration
    python manage.py migrate shopify_integration
fi

# 7. Run all migrations
echo "🔄 Running all migrations..."
python manage.py migrate

echo "✅ Deployment fixes complete!"

