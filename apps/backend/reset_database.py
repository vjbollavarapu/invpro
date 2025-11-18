#!/usr/bin/env python
"""
Database Reset Script

This script handles the complete reset of the database and migrations
after model structure changes.
"""

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()

def reset_database():
    """Reset database and migrations"""
    print("🔄 Starting database reset process...")
    
    try:
        # Step 1: Show current migrations
        print("\n📋 Current migrations:")
        execute_from_command_line(['manage.py', 'showmigrations'])
        
        # Step 2: Drop all tables (if database exists)
        print("\n🗑️  Dropping all tables...")
        try:
            execute_from_command_line(['manage.py', 'dbshell', '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'])
        except Exception as e:
            print(f"⚠️  Could not drop schema (might not exist): {e}")
        
        # Step 3: Create new migrations
        print("\n📝 Creating new migrations...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        
        # Step 4: Apply migrations
        print("\n🚀 Applying migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Step 5: Create superuser (optional)
        print("\n👤 Creating superuser...")
        try:
            execute_from_command_line(['manage.py', 'createsuperuser', '--noinput', '--username', 'admin', '--email', 'admin@example.com'])
            print("✅ Superuser created: admin/admin")
        except Exception as e:
            print(f"⚠️  Could not create superuser: {e}")
        
        # Step 6: Show final migrations
        print("\n📋 Final migrations:")
        execute_from_command_line(['manage.py', 'showmigrations'])
        
        print("\n✅ Database reset completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during database reset: {e}")
        sys.exit(1)

if __name__ == '__main__':
    setup_django()
    reset_database()
