"""
Seed pharmacy test data
Run with: python manage.py shell < seed_pharmacy_data.py
Or: python seed_pharmacy_data.py
"""

import os
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tenants.models import Tenant, Membership
from users.models import User
from warehouse.models import Warehouse
from procurement.models import Supplier
from pharma.models import DrugProduct, PackagingLevel, DrugBatch, DrugInventory


def seed_pharmacy_data():
    print("Starting pharmacy data seeding...")
    
    # Get or create pharmacy tenant
    tenant, created = Tenant.objects.get_or_create(
        code='pharmacy-demo',
        defaults={
            'name': 'Demo Pharmacy',
            'industry': 'pharmacy',
            'is_active': True,
        }
    )
    
    if created:
        print(f"✅ Created tenant: {tenant.name}")
    else:
        print(f"ℹ️  Using existing tenant: {tenant.name}")
        # Update industry if not set
        if tenant.industry != 'pharmacy':
            tenant.industry = 'pharmacy'
            tenant.save()
            print(f"✅ Updated tenant industry to: pharmacy")
    
    # Get or create pharmacy user
    user, created = User.objects.get_or_create(
        email='pharmacist@demo.com',
        defaults={
            'first_name': 'Demo',
            'last_name': 'Pharmacist',
        }
    )
    
    if created:
        user.set_password('Pharma123456')
        user.save()
        print(f"✅ Created user: {user.email} (password: Pharma123456)")
    else:
        print(f"ℹ️  Using existing user: {user.email}")
    
    # Create membership
    membership, created = Membership.objects.get_or_create(
        user=user,
        tenant=tenant,
        defaults={'role': 'admin', 'is_active': True}
    )
    
    if created:
        print(f"✅ Created membership for {user.email}")
    else:
        print(f"ℹ️  Membership already exists")
    
    # Create warehouse
    warehouse, created = Warehouse.objects.get_or_create(
        tenant_id=tenant.id,
        warehouse_code='PHARM-WH-01',
        defaults={
            'name': 'Main Pharmacy Warehouse',
            'location': 'Building A',
            'status': 'active',
        }
    )
    print(f"{'✅ Created' if created else 'ℹ️  Using'} warehouse: {warehouse.name}")
    
    # Create supplier
    supplier, created = Supplier.objects.get_or_create(
        tenant_id=tenant.id,
        name='MedSupply Corp',
        defaults={
            'email': 'sales@medsupply.com',
            'phone': '+1-555-0100',
            'address': '456 Supplier Ave, Supply City, USA',
            'contact_person': 'John Supply',
            'rating': Decimal('4.5'),
        }
    )
    print(f"{'✅ Created' if created else 'ℹ️  Using'} supplier: {supplier.name}")
    
    # Create Drug Products with Packaging Levels
    print("\n📦 Creating drug products...")
    
    drugs_data = [
        {
            'generic_name': 'Paracetamol',
            'brand_name': 'Tylenol',
            'dosage_form': 'tablet',
            'strength': '500mg',
            'route_of_administration': 'oral',
            'therapeutic_class': 'Analgesic',
            'pharmacological_class': 'Non-opioid analgesic',
            'active_ingredients': 'Paracetamol',
            'storage_conditions': 'room_temp',
            'requires_prescription': False,
            'packaging': [
                {'name': 'Tablet', 'order': 1, 'qty': 1, 'unit': 'tablet', 'cost': 0.10, 'sell': 0.25, 'dispense': True, 'purchase': False},
                {'name': 'Strip', 'order': 2, 'qty': 10, 'unit': 'strip', 'cost': 0.90, 'sell': 2.00, 'dispense': True, 'purchase': False},
                {'name': 'Box', 'order': 3, 'qty': 100, 'unit': 'box', 'cost': 8.00, 'sell': 18.00, 'dispense': False, 'purchase': True},
            ]
        },
        {
            'generic_name': 'Amoxicillin',
            'brand_name': 'Amoxil',
            'dosage_form': 'capsule',
            'strength': '500mg',
            'route_of_administration': 'oral',
            'therapeutic_class': 'Antibiotic',
            'pharmacological_class': 'Beta-lactam',
            'active_ingredients': 'Amoxicillin Trihydrate',
            'storage_conditions': 'cool',
            'requires_prescription': True,
            'packaging': [
                {'name': 'Capsule', 'order': 1, 'qty': 1, 'unit': 'capsule', 'cost': 0.50, 'sell': 1.20, 'dispense': True, 'purchase': False},
                {'name': 'Strip', 'order': 2, 'qty': 10, 'unit': 'strip', 'cost': 4.50, 'sell': 10.00, 'dispense': True, 'purchase': False},
                {'name': 'Carton', 'order': 3, 'qty': 1000, 'unit': 'carton', 'cost': 400.00, 'sell': 900.00, 'dispense': False, 'purchase': True},
            ]
        },
        {
            'generic_name': 'Ibuprofen',
            'brand_name': 'Advil',
            'dosage_form': 'tablet',
            'strength': '400mg',
            'route_of_administration': 'oral',
            'therapeutic_class': 'Anti-inflammatory',
            'pharmacological_class': 'NSAID',
            'active_ingredients': 'Ibuprofen',
            'storage_conditions': 'room_temp',
            'requires_prescription': False,
            'packaging': [
                {'name': 'Tablet', 'order': 1, 'qty': 1, 'unit': 'tablet', 'cost': 0.08, 'sell': 0.20, 'dispense': True, 'purchase': False},
                {'name': 'Strip', 'order': 2, 'qty': 10, 'unit': 'strip', 'cost': 0.75, 'sell': 1.80, 'dispense': True, 'purchase': False},
                {'name': 'Box', 'order': 3, 'qty': 200, 'unit': 'box', 'cost': 14.00, 'sell': 32.00, 'dispense': False, 'purchase': True},
            ]
        },
    ]
    
    for drug_data in drugs_data:
        packaging_data = drug_data.pop('packaging')
        
        drug, created = DrugProduct.objects.get_or_create(
            tenant_id=tenant.id,
            generic_name=drug_data['generic_name'],
            defaults={
                **drug_data,
                'supplier': supplier,
                'status': 'active',
            }
        )
        
        if created:
            print(f"  ✅ Created drug: {drug.generic_name} {drug.strength}")
            
            # Create packaging levels
            for pkg in packaging_data:
                level = PackagingLevel.objects.create(
                    tenant_id=tenant.id,
                    drug_product=drug,
                    level_name=pkg['name'],
                    level_order=pkg['order'],
                    base_unit_quantity=Decimal(str(pkg['qty'])),
                    unit_of_measure=pkg['unit'],
                    cost_price=Decimal(str(pkg['cost'])),
                    selling_price=Decimal(str(pkg['sell'])),
                    can_dispense=pkg['dispense'],
                    can_purchase=pkg['purchase'],
                )
                print(f"    📦 Added packaging: {level.level_name} ({level.base_unit_quantity} base units)")
            
            # Create batches
            box_level = PackagingLevel.objects.filter(
                drug_product=drug,
                can_purchase=True
            ).first()
            
            if box_level:
                # Batch 1: Fresh batch
                batch1 = DrugBatch.objects.create(
                    tenant_id=tenant.id,
                    drug_product=drug,
                    batch_number=f"BATCH-{drug.generic_name[:3].upper()}-001",
                    lot_number=f"LOT-{drug.generic_name[:3].upper()}-2024-01",
                    manufacture_date=date.today() - timedelta(days=90),
                    expiry_date=date.today() + timedelta(days=640),  # ~21 months
                    initial_quantity=box_level.convert_to_base_units(Decimal('50')),
                    current_quantity=box_level.convert_to_base_units(Decimal('50')),
                    packaging_level=box_level,
                    status='approved',
                    warehouse=warehouse,
                    storage_location=f'Shelf-A-{drug.id}',
                    supplier=supplier,
                    unit_cost=box_level.cost_price,
                )
                print(f"    🔖 Batch 1: {batch1.batch_number} (Approved, {batch1.days_until_expiry()} days to expiry)")
                
                # Batch 2: Expiring soon (30 days)
                batch2 = DrugBatch.objects.create(
                    tenant_id=tenant.id,
                    drug_product=drug,
                    batch_number=f"BATCH-{drug.generic_name[:3].upper()}-002",
                    lot_number=f"LOT-{drug.generic_name[:3].upper()}-2023-12",
                    manufacture_date=date.today() - timedelta(days=335),
                    expiry_date=date.today() + timedelta(days=30),  # Expiring in 30 days
                    initial_quantity=box_level.convert_to_base_units(Decimal('20')),
                    current_quantity=box_level.convert_to_base_units(Decimal('15')),
                    packaging_level=box_level,
                    status='approved',
                    warehouse=warehouse,
                    storage_location=f'Shelf-B-{drug.id}',
                    supplier=supplier,
                    unit_cost=box_level.cost_price,
                )
                print(f"    🔖 Batch 2: {batch2.batch_number} (Expiring in {batch2.days_until_expiry()} days)")
                
                # Batch 3: In quarantine
                batch3 = DrugBatch.objects.create(
                    tenant_id=tenant.id,
                    drug_product=drug,
                    batch_number=f"BATCH-{drug.generic_name[:3].upper()}-003",
                    manufacture_date=date.today() - timedelta(days=10),
                    expiry_date=date.today() + timedelta(days=720),
                    initial_quantity=box_level.convert_to_base_units(Decimal('30')),
                    current_quantity=box_level.convert_to_base_units(Decimal('30')),
                    packaging_level=box_level,
                    status='quarantine',
                    warehouse=warehouse,
                    storage_location=f'QC-Area-{drug.id}',
                    supplier=supplier,
                    unit_cost=box_level.cost_price,
                )
                print(f"    🔖 Batch 3: {batch3.batch_number} (Quarantine)")
        else:
            print(f"  ℹ️  Drug already exists: {drug.generic_name}")
    
    print("\n✅ Pharmacy data seeding complete!")
    print(f"\n📊 Summary:")
    print(f"  - Tenant: {tenant.name} (Industry: {tenant.industry})")
    print(f"  - User: {user.email} / Pharma123456")
    print(f"  - Drugs: {DrugProduct.objects.filter(tenant_id=tenant.id).count()}")
    print(f"  - Packaging Levels: {PackagingLevel.objects.filter(tenant_id=tenant.id).count()}")
    print(f"  - Batches: {DrugBatch.objects.filter(tenant_id=tenant.id).count()}")
    print(f"  - Warehouse: {warehouse.name}")
    print(f"  - Supplier: {supplier.name}")
    print(f"\n🚀 Ready to test pharmacy APIs!")


if __name__ == '__main__':
    seed_pharmacy_data()

