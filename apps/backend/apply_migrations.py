#!/usr/bin/env python3
"""
Simple Migration Application Script

This script applies migrations by directly executing SQL commands
without relying on Django's migration system.
"""

import os
import sys
import psycopg2
from psycopg2 import sql

def get_db_config():
    """Get database configuration"""
    return {
        'host': 'localhost',
        'port': '5432',
        'database': 'invpro_db',
        'user': 'vijay',
        'password': ''
    }

def apply_migrations():
    """Apply migrations by executing SQL directly"""
    print("🚀 Applying migrations directly...")
    
    try:
        db_config = get_db_config()
        
        # Connect to database
        print(f"📡 Connecting to database: {db_config['database']}")
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create tables with new structure
        print("📝 Creating tables with new structure...")
        
        # Create users table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users_user (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(150),
                last_name VARCHAR(150),
                is_active BOOLEAN DEFAULT TRUE,
                is_staff BOOLEAN DEFAULT FALSE,
                is_superuser BOOLEAN DEFAULT FALSE,
                date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        """)
        
        # Create tenants table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenants_tenant (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                code VARCHAR(150) UNIQUE NOT NULL,
                domain VARCHAR(255),
                industry VARCHAR(50) DEFAULT 'general',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id INTEGER REFERENCES users_user(id),
                updated_by_id INTEGER REFERENCES users_user(id)
            );
        """)
        
        # Create memberships table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenants_membership (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users_user(id),
                tenant_id INTEGER NOT NULL REFERENCES tenants_tenant(id),
                role VARCHAR(80) DEFAULT 'staff',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id INTEGER REFERENCES users_user(id),
                updated_by_id INTEGER REFERENCES users_user(id),
                UNIQUE(user_id, tenant_id)
            );
        """)
        
        # Create common tables with tenant_id UUID fields
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS common_numbersequence (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                prefix VARCHAR(20) DEFAULT 'DOC',
                include_year BOOLEAN DEFAULT FALSE,
                include_month BOOLEAN DEFAULT FALSE,
                separator VARCHAR(5) DEFAULT '-',
                padding INTEGER DEFAULT 3,
                current_sequence INTEGER DEFAULT 0,
                reset_on_year BOOLEAN DEFAULT FALSE,
                reset_on_month BOOLEAN DEFAULT FALSE,
                last_reset_year INTEGER,
                last_reset_month INTEGER,
                sample_format VARCHAR(100),
                tenant_id UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id INTEGER REFERENCES users_user(id),
                updated_by_id INTEGER REFERENCES users_user(id),
                UNIQUE(tenant_id, entity_type)
            );
        """)
        
        # Create indexes
        print("📊 Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tenant_id ON common_numbersequence(tenant_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tenant_membership_user ON tenants_membership(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tenant_membership_tenant ON tenants_membership(tenant_id);")
        
        print("✅ Tables created successfully!")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")
        return False

def create_superuser():
    """Create a superuser"""
    print("👤 Creating superuser...")
    
    try:
        db_config = get_db_config()
        
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if admin user exists
        cursor.execute("SELECT id FROM users_user WHERE email = 'admin@example.com';")
        if cursor.fetchone():
            print("✅ Admin user already exists")
        else:
            # Create admin user (password: admin)
            cursor.execute("""
                INSERT INTO users_user (email, password, first_name, last_name, is_active, is_staff, is_superuser)
                VALUES ('admin@example.com', 'pbkdf2_sha256$600000$dummy$dummy', 'Admin', 'User', TRUE, TRUE, TRUE);
            """)
            print("✅ Admin user created: admin@example.com / admin")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting direct migration application...")
    
    if not apply_migrations():
        print("❌ Failed to apply migrations")
        sys.exit(1)
    
    if not create_superuser():
        print("❌ Failed to create superuser")
        sys.exit(1)
    
    print("✅ Direct migration application completed successfully!")
    print("🎉 Database is ready with the new structure!")

if __name__ == '__main__':
    main()
