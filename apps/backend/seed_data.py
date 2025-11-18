"""
Seed Data Script for InvPro360

This script creates realistic test data for comprehensive testing.
Run with: python manage.py shell < seed_data.py
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from users.models import User
from tenants.models import Tenant, Membership
from inventory.models import Product, StockMovement
from sales.models import Customer, Order, OrderItem
from procurement.models import Supplier, PurchaseOrder, PurchaseRequest
from warehouse.models import Warehouse, Transfer
from finance.models import CostCenter, Expense

print("\n" + "="*80)
print("🌱 SEEDING DATABASE WITH TEST DATA")
print("="*80)

# ==================== CREATE TENANTS ====================
print("\n1️⃣  Getting or Creating Tenants...")

tenant1, created = Tenant.objects.get_or_create(
    code="demo-manufacturing",
    defaults={
        'name': "Demo Manufacturing Co",
        'domain': "demo.invpro360.com",
        'is_active': True
    }
)
print(f"   ✅ {tenant1.name} {'[CREATED]' if created else '[EXISTS]'}")

tenant2, created = Tenant.objects.get_or_create(
    code="test-wholesale",
    defaults={
        'name': "Test Wholesale Inc",
        'domain': "test.invpro360.com",
        'is_active': True
    }
)
print(f"   ✅ {tenant2.name} {'[CREATED]' if created else '[EXISTS]'}")

# ==================== CREATE USERS ====================
print("\n2️⃣  Creating Users...")

# User for tenant 1 (admin)
user1, created = User.objects.get_or_create(
    email='demo@example.com',
    defaults={
        'first_name': 'Demo',
        'last_name': 'Admin'
    }
)
if created:
    user1.set_password('Demo123456')
    user1.save()
    print(f"   ✅ {user1.email} (demo@example.com / Demo123456) [CREATED]")
else:
    print(f"   ✅ {user1.email} (using existing user)")

# User for tenant 2
user2, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'first_name': 'Test',
        'last_name': 'User'
    }
)
if created:
    user2.set_password('Test123456')
    user2.save()
    print(f"   ✅ {user2.email} (test@example.com / Test123456) [CREATED]")
else:
    print(f"   ✅ {user2.email} (using existing user)")

# Multi-tenant user
user3, created = User.objects.get_or_create(
    email='multi@example.com',
    defaults={
        'first_name': 'Multi',
        'last_name': 'Tenant'
    }
)
if created:
    user3.set_password('Multi123456')
    user3.save()
    print(f"   ✅ {user3.email} (multi@example.com / Multi123456) - Multi-tenant [CREATED]")
else:
    print(f"   ✅ {user3.email} (using existing user) - Multi-tenant")

# ==================== CREATE MEMBERSHIPS ====================
print("\n3️⃣  Creating Memberships...")

Membership.objects.get_or_create(user=user1, tenant=tenant1, defaults={'role': 'admin', 'is_active': True})
print(f"   ✅ {user1.email} → {tenant1.name} (admin)")

Membership.objects.get_or_create(user=user2, tenant=tenant2, defaults={'role': 'admin', 'is_active': True})
print(f"   ✅ {user2.email} → {tenant2.name} (admin)")

# Multi-tenant user belongs to both
Membership.objects.get_or_create(user=user3, tenant=tenant1, defaults={'role': 'staff', 'is_active': True})
Membership.objects.get_or_create(user=user3, tenant=tenant2, defaults={'role': 'manager', 'is_active': True})
print(f"   ✅ {user3.email} → Both tenants (staff/manager)")

# ==================== CREATE WAREHOUSES ====================
print("\n4️⃣  Creating Warehouses...")

# Tenant 1 warehouses
wh1_t1 = Warehouse.objects.create(
    tenant_id=tenant1.id,
    name="Central Distribution Center",
    location="New York, NY",
    max_capacity=1000,
    current_utilization=850,
    active_clients=12,
    total_skus=450,
    status="active"
)
print(f"   ✅ {wh1_t1.warehouse_code} - {wh1_t1.name}")

wh2_t1 = Warehouse.objects.create(
    tenant_id=tenant1.id,
    name="West Coast Hub",
    location="Los Angeles, CA",
    max_capacity=800,
    current_utilization=550,
    active_clients=8,
    total_skus=320,
    status="active"
)
print(f"   ✅ {wh2_t1.warehouse_code} - {wh2_t1.name}")

# Tenant 2 warehouse
wh1_t2 = Warehouse.objects.create(
    tenant_id=tenant2.id,
    name="Main Warehouse",
    location="Chicago, IL",
    max_capacity=1200,
    current_utilization=900,
    active_clients=15,
    total_skus=580,
    status="active"
)
print(f"   ✅ {wh1_t2.warehouse_code} - {wh1_t2.name}")

# ==================== CREATE SUPPLIERS ====================
print("\n5️⃣  Creating Suppliers...")

suppliers_t1 = []
supplier_data = [
    ("Global Supplies Inc", "James Wilson", "james@globalsupplies.com", "+1-555-123-4567", "123 Industrial Blvd, NY", 4.8),
    ("TechWarehouse Ltd", "Lisa Anderson", "lisa@techwarehouse.com", "+1-555-234-5678", "456 Tech Park, SF", 4.6),
    ("Industrial Parts Co", "Robert Martinez", "robert@industrialparts.com", "+1-555-345-6789", "789 Manufacturing Dr, Chicago", 4.9),
]

for name, contact, email, phone, address, rating in supplier_data:
    supplier = Supplier.objects.create(
        tenant_id=tenant1.id,
        name=name,
        contact_person=contact,
        email=email,
        phone=phone,
        address=address,
        rating=Decimal(str(rating))
    )
    suppliers_t1.append(supplier)
    print(f"   ✅ {supplier.supplier_code} - {supplier.name}")

# ==================== CREATE PRODUCTS ====================
print("\n6️⃣  Creating Products...")

products_t1 = []
product_data = [
    ("Industrial Steel Pipes", "ISP-2024-001", "Raw Materials", "pcs", 450, 100, 45.99, 65.00),
    ("Hydraulic Pumps", "HP-2024-002", "Equipment", "pcs", 75, 50, 289.99, 420.00),
    ("Safety Helmets", "SH-2024-003", "Safety Equipment", "pcs", 15, 200, 12.99, 25.00),  # Low stock
    ("Electric Motors", "EM-2024-004", "Equipment", "pcs", 120, 30, 456.50, 650.00),
    ("Copper Wiring", "CW-2024-005", "Raw Materials", "meters", 850, 500, 3.25, 5.50),
    ("Industrial Bearings", "IB-2024-006", "Parts", "pcs", 300, 100, 15.75, 28.00),
    ("Hydraulic Fluid", "HF-2024-007", "Consumables", "liters", 0, 50, 8.50, 15.00),  # Out of stock
    ("Welding Rods", "WR-2024-008", "Consumables", "kg", 45, 200, 12.00, 22.00),  # Low stock
]

for name, sku, category, unit, qty, reorder, cost, price in product_data:
    product = Product.objects.create(
        tenant_id=tenant1.id,
        name=name,
        sku=sku,
        category=category,
        unit=unit,
        quantity=qty,
        reorder_level=reorder,
        unit_cost=Decimal(str(cost)),
        selling_price=Decimal(str(price)),
        supplier=suppliers_t1[0] if suppliers_t1 else None,
        description=f"High quality {name.lower()} for industrial use",
        status="active"
    )
    products_t1.append(product)
    status_emoji = "📦" if qty > reorder else "⚠️" if qty > 0 else "❌"
    print(f"   {status_emoji} {product.product_code} - {product.name} ({qty} {unit})")

# Tenant 2 products
products_t2 = []
for i in range(5):
    product = Product.objects.create(
        tenant_id=tenant2.id,
        name=f"Wholesale Product {i+1}",
        sku=f"WS-{i+1:03d}",
        category="Wholesale",
        unit="pcs",
        quantity=100 + (i * 50),
        reorder_level=50,
        unit_cost=Decimal('25.00'),
        selling_price=Decimal('45.00'),
        status="active"
    )
    products_t2.append(product)
    print(f"   📦 {product.product_code} - {product.name}")

# ==================== CREATE CUSTOMERS ====================
print("\n7️⃣  Creating Customers...")

customers_t1 = []
customer_data = [
    ("Acme Corporation", "orders@acme.com", "+1-555-111-2222", "100 Business St, NY"),
    ("TechStart Inc", "purchasing@techstart.com", "+1-555-222-3333", "200 Tech Ave, SF"),
    ("Global Retail Ltd", "orders@globalretail.com", "+1-555-333-4444", "300 Commerce Blvd, LA"),
    ("Metro Supplies", "contact@metrosupplies.com", "+1-555-444-5555", "400 Supply Lane, Chicago"),
    ("Prime Distributors", "sales@primedist.com", "+1-555-555-6666", "500 Distribution Way, Dallas"),
]

for name, email, phone, address in customer_data:
    customer = Customer.objects.create(
        tenant_id=tenant1.id,
        name=name,
        email=email,
        phone=phone,
        address=address
    )
    customers_t1.append(customer)
    print(f"   ✅ {customer.customer_code} - {customer.name}")

# ==================== CREATE ORDERS ====================
print("\n8️⃣  Creating Orders...")

orders_t1 = []
order_statuses = ['delivered', 'shipped', 'processing', 'pending', 'delivered']

for i, customer in enumerate(customers_t1):
    # Create order
    order = Order.objects.create(
        tenant_id=tenant1.id,
        customer=customer,
        channel='shopify' if i % 2 == 0 else 'manual',
        total_amount=Decimal('0.00'),
        status=order_statuses[i],
        fulfilled_at=timezone.now() - timedelta(days=i) if order_statuses[i] == 'delivered' else None
    )
    
    # Add 2-3 random items to each order
    total = Decimal('0.00')
    for j in range(2 + (i % 2)):
        product = products_t1[j % len(products_t1)]
        quantity = 3 + (i * 2)
        price = product.selling_price
        
        OrderItem.objects.create(
            tenant_id=tenant1.id,
            order=order,
            product=product,
            quantity=quantity,
            price=price
        )
        total += quantity * price
    
    # Update order total
    order.total_amount = total
    order.save()
    orders_t1.append(order)
    
    print(f"   ✅ {order.order_number} - {customer.name} (${total}) [{order.status}]")

# ==================== CREATE PURCHASE ORDERS ====================
print("\n9️⃣  Creating Purchase Orders...")

po_statuses = ['delivered', 'in-transit', 'processing', 'pending']

for i, supplier in enumerate(suppliers_t1):
    po = PurchaseOrder.objects.create(
        tenant_id=tenant1.id,
        supplier=supplier,
        total_amount=Decimal(f'{5000 + (i * 2500)}.00'),
        expected_delivery_date=(timezone.now() + timedelta(days=7 + i)).date(),
        status=po_statuses[i % len(po_statuses)]
    )
    print(f"   ✅ {po.po_number} - {supplier.name} (${po.total_amount}) [{po.status}]")

# ==================== CREATE PURCHASE REQUESTS ====================
print("\n🔟 Creating Purchase Requests...")

for i, product in enumerate(products_t1[:4]):
    pr = PurchaseRequest.objects.create(
        tenant_id=tenant1.id,
        requested_by=user1,
        item=product,
        quantity=100 + (i * 50),
        status=['pending', 'approved', 'pending', 'rejected'][i]
    )
    print(f"   ✅ {pr.request_number} - {product.name} (Qty: {pr.quantity}) [{pr.status}]")

# ==================== CREATE COST CENTERS ====================
print("\n1️⃣1️⃣  Creating Cost Centers...")

cost_centers = [
    ("Warehouse Operations", 150000, 142500),
    ("Procurement", 200000, 215000),
    ("Sales & Marketing", 100000, 98500),
    ("Logistics & Shipping", 120000, 125000),
    ("IT & Systems", 80000, 76000),
]

for name, budget, actual in cost_centers:
    cc = CostCenter.objects.create(
        tenant_id=tenant1.id,
        name=name,
        budget=Decimal(str(budget)),
        actual_cost=Decimal(str(actual))
    )
    variance = actual - budget
    print(f"   ✅ {cc.name} (Budget: ${budget:,}, Actual: ${actual:,}, Variance: ${variance:+,})")

# ==================== CREATE EXPENSES ====================
print("\n1️⃣2️⃣  Creating Expenses...")

expense_categories = ['Facilities', 'Operations', 'IT', 'Logistics', 'Marketing']
expense_data = [
    ("Warehouse Rent - January", "Facilities", 12000, orders_t1[0] if orders_t1 else None),
    ("Office Supplies", "Operations", 850, None),
    ("Software Licenses", "IT", 5400, None),
    ("Shipping & Freight", "Logistics", 8200, orders_t1[1] if len(orders_t1) > 1 else None),
    ("Marketing Campaign", "Marketing", 15000, None),
    ("Equipment Maintenance", "Operations", 3500, None),
    ("Server Hosting", "IT", 2400, None),
]

for i, (desc, category, amount, linked_order) in enumerate(expense_data):
    date = (timezone.now() - timedelta(days=30-i*4)).date()
    expense = Expense.objects.create(
        tenant_id=tenant1.id,
        date=date,
        description=desc,
        category=category,
        amount=Decimal(str(amount)),
        linked_order=linked_order
    )
    linked = f"→ {linked_order.order_number}" if linked_order else ""
    print(f"   ✅ ${amount:,} - {desc} {linked}")

# ==================== CREATE STOCK MOVEMENTS ====================
print("\n1️⃣3️⃣  Creating Stock Movements...")

movements = [
    (products_t1[0], 100, 'in', "Received from supplier"),
    (products_t1[1], 25, 'out', "Sold to customer"),
    (products_t1[2], 50, 'in', "Restocked"),
    (products_t1[3], 30, 'transfer', "Transferred to warehouse"),
]

for product, qty, movement_type, reason in movements:
    sm = StockMovement.objects.create(
        tenant_id=tenant1.id,
        product=product,
        quantity=qty,
        movement_type=movement_type,
        reason=reason,
        performed_by=user1,
        source_warehouse=wh1_t1 if movement_type == 'transfer' else None,
        destination_warehouse=wh2_t1 if movement_type == 'transfer' else wh1_t1
    )
    print(f"   ✅ {movement_type.upper()}: {product.name} ({qty} units)")

# ==================== CREATE TRANSFERS ====================
print("\n1️⃣4️⃣  Creating Warehouse Transfers...")

transfer = Transfer.objects.create(
    tenant_id=tenant1.id,
    from_warehouse=wh1_t1,
    to_warehouse=wh2_t1,
    product=products_t1[0],
    quantity=50,
    status='in-transit'
)
print(f"   ✅ {transfer.transfer_number} - {wh1_t1.name} → {wh2_t1.name}")

# ==================== SUMMARY ====================
print("\n" + "="*80)
print("📊 SEED DATA SUMMARY")
print("="*80)

print(f"\n✅ Tenants: {Tenant.objects.count()}")
print(f"✅ Users: {User.objects.count()}")
print(f"✅ Memberships: {Membership.objects.count()}")
print(f"\nTenant 1 ({tenant1.name}):")
print(f"   Products: {Product.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Customers: {Customer.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Orders: {Order.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Suppliers: {Supplier.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Purchase Orders: {PurchaseOrder.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Warehouses: {Warehouse.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Cost Centers: {CostCenter.objects.filter(tenant_id=tenant1.id).count()}")
print(f"   Expenses: {Expense.objects.filter(tenant_id=tenant1.id).count()}")

print(f"\nTenant 2 ({tenant2.name}):")
print(f"   Products: {Product.objects.filter(tenant_id=tenant2.id).count()}")

print("\n" + "="*80)
print("🎉 SEED DATA COMPLETE!")
print("="*80)

print("\n🔑 Login Credentials:")
print("   Tenant 1 Admin:")
print("      Username: demo")
print("      Password: Demo123456")
print("      Tenant: Demo Manufacturing Co")
print("")
print("   Tenant 2 Admin:")
print("      Username: testuser")
print("      Password: Test123456")
print("      Tenant: Test Wholesale Inc")
print("")
print("   Multi-Tenant User:")
print("      Username: multitenant")
print("      Password: Multi123456")
print("      Tenants: Both (can switch between)")
print("="*80)
print("")

