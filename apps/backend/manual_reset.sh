#!/bin/bash

# Manual Database Reset Script
# This script handles the complete reset of the database and migrations

echo "🔄 Starting manual database reset process..."

# Navigate to backend directory
cd /Users/vijayababubollavarapu/dev/invpro/apps/backend

# Activate virtual environment
source venv/bin/activate

echo "📋 Step 1: Showing current migrations"
./venv/bin/python manage.py showmigrations

echo "🗑️  Step 2: Dropping all tables"
./venv/bin/python manage.py dbshell -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "📝 Step 3: Creating new migrations"
./venv/bin/python manage.py makemigrations

echo "🚀 Step 4: Applying migrations"
./venv/bin/python manage.py migrate

echo "👤 Step 5: Creating superuser"
./venv/bin/python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superuser created: admin/admin')
else:
    print('Superuser already exists')
"

echo "📋 Step 6: Final migrations status"
./venv/bin/python manage.py showmigrations

echo "✅ Database reset completed successfully!"
