#!/usr/bin/env python3
"""
Simple Database Reset Script

This script handles the database reset without relying on Django commands
that might have import issues.
"""

import os
import sys
import subprocess
import psycopg2
from psycopg2 import sql

def get_db_config():
    """Get database configuration from environment or defaults"""
    return {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'invpro_db'),
        'user': os.getenv('POSTGRES_USER', 'vijay'),
        'password': os.getenv('POSTGRES_PASSWORD', '')
    }

def reset_database():
    """Reset the database by dropping and recreating schema"""
    print("🔄 Starting database reset...")
    
    try:
        # Get database config
        db_config = get_db_config()
        
        # Connect to database
        print(f"📡 Connecting to database: {db_config['database']}")
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Drop and recreate schema
        print("🗑️  Dropping all tables...")
        cursor.execute("DROP SCHEMA public CASCADE;")
        cursor.execute("CREATE SCHEMA public;")
        cursor.execute("GRANT ALL ON SCHEMA public TO postgres;")
        cursor.execute("GRANT ALL ON SCHEMA public TO public;")
        
        print("✅ Database schema reset completed!")
        
        # Close connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False

def create_migrations():
    """Create new migrations"""
    print("📝 Creating new migrations...")
    
    try:
        # Try to run makemigrations
        result = subprocess.run([
            sys.executable, 'manage.py', 'makemigrations'
        ], capture_output=True, text=True, cwd='/Users/vijayababubollavarapu/dev/invpro/apps/backend')
        
        if result.returncode == 0:
            print("✅ Migrations created successfully!")
            print(result.stdout)
            return True
        else:
            print(f"❌ Error creating migrations: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running makemigrations: {e}")
        return False

def apply_migrations():
    """Apply migrations"""
    print("🚀 Applying migrations...")
    
    try:
        # Try to run migrate
        result = subprocess.run([
            sys.executable, 'manage.py', 'migrate'
        ], capture_output=True, text=True, cwd='/Users/vijayababubollavarapu/dev/invpro/apps/backend')
        
        if result.returncode == 0:
            print("✅ Migrations applied successfully!")
            print(result.stdout)
            return True
        else:
            print(f"❌ Error applying migrations: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running migrate: {e}")
        return False

def main():
    """Main function"""
    print("🔄 Starting complete database reset process...")
    
    # Step 1: Reset database
    if not reset_database():
        print("❌ Failed to reset database")
        sys.exit(1)
    
    # Step 2: Create migrations
    if not create_migrations():
        print("❌ Failed to create migrations")
        sys.exit(1)
    
    # Step 3: Apply migrations
    if not apply_migrations():
        print("❌ Failed to apply migrations")
        sys.exit(1)
    
    print("✅ Database reset completed successfully!")
    print("\n🎉 Your database is now ready with the new model structure!")

if __name__ == '__main__':
    main()
