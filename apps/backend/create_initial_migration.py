#!/usr/bin/env python3
"""
Create Initial Migration Script

This script creates the initial migration files manually
since Django commands are having issues.
"""

import os
import sys
from datetime import datetime

def create_migration_file(app_name, migration_name, content):
    """Create a migration file with the given content"""
    migration_dir = f"apps/backend/{app_name}/migrations"
    migration_file = f"{migration_dir}/{migration_name}.py"
    
    # Ensure migration directory exists
    os.makedirs(migration_dir, exist_ok=True)
    
    # Create __init__.py if it doesn't exist
    init_file = f"{migration_dir}/__init__.py"
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write("")
    
    # Write migration file
    with open(migration_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Created migration: {migration_file}")

def create_common_migration():
    """Create migration for common app"""
    content = '''# Generated manually for tenant_id field changes

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='BaseModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_created', to='users.user')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_updated', to='users.user')),
            ],
            options={
                'abstract': True,
            },
        ),
        migrations.CreateModel(
            name='TenantAwareModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant_id', models.UUIDField(db_index=True, help_text='Tenant ID for multi-tenant isolation')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_created', to='users.user')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_updated', to='users.user')),
            ],
            options={
                'abstract': True,
            },
        ),
        migrations.CreateModel(
            name='NumberSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('entity_type', models.CharField(choices=[('product', 'Product'), ('order', 'Sales Order'), ('purchase_order', 'Purchase Order'), ('purchase_request', 'Purchase Request'), ('warehouse', 'Warehouse'), ('transfer', 'Transfer'), ('supplier', 'Supplier'), ('customer', 'Customer')], max_length=50)),
                ('prefix', models.CharField(default='DOC', max_length=20)),
                ('include_year', models.BooleanField(default=False)),
                ('include_month', models.BooleanField(default=False)),
                ('separator', models.CharField(default='-', max_length=5)),
                ('padding', models.IntegerField(default=3)),
                ('current_sequence', models.IntegerField(default=0)),
                ('reset_on_year', models.BooleanField(default=False)),
                ('reset_on_month', models.BooleanField(default=False)),
                ('last_reset_year', models.IntegerField(blank=True, null=True)),
                ('last_reset_month', models.IntegerField(blank=True, null=True)),
                ('sample_format', models.CharField(blank=True, max_length=100)),
                ('tenant_id', models.UUIDField(db_index=True, help_text='Tenant ID for multi-tenant isolation')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_created', to='users.user')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_updated', to='users.user')),
            ],
            options={
                'verbose_name': 'Number Sequence',
                'verbose_name_plural': 'Number Sequences',
            },
        ),
        migrations.AlterUniqueTogether(
            name='numbersequence',
            unique_together={('tenant_id', 'entity_type')},
        ),
    ]
'''
    create_migration_file('common', '0001_initial', content)

def create_tenants_migration():
    """Create migration for tenants app"""
    content = '''# Generated manually for tenant model

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('common', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tenant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=150)),
                ('code', models.SlugField(unique=True)),
                ('domain', models.CharField(blank=True, max_length=255)),
                ('industry', models.CharField(choices=[('pharmacy', 'Pharmacy'), ('retail', 'Retail'), ('logistics', 'Logistics'), ('manufacturing', 'Manufacturing'), ('general', 'General Inventory')], db_index=True, default='general', help_text='Industry type determines available features and data models', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_created', to='users.user')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_updated', to='users.user')),
            ],
        ),
        migrations.CreateModel(
            name='Membership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role', models.CharField(default='staff', max_length=80)),
                ('is_active', models.BooleanField(default=True)),
                ('tenant', models.ForeignKey(on_delete=models.deletion.CASCADE, to='tenants.tenant')),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, to='users.user')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_created', to='users.user')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='%(class)s_updated', to='users.user')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='membership',
            unique_together={('user', 'tenant')},
        ),
    ]
'''
    create_migration_file('tenants', '0001_initial', content)

def main():
    """Main function"""
    print("📝 Creating initial migrations manually...")
    
    # Create migrations for each app
    create_common_migration()
    create_tenants_migration()
    
    print("✅ Initial migrations created successfully!")
    print("\n🎉 You can now run 'python manage.py migrate' to apply the migrations!")

if __name__ == '__main__':
    main()
