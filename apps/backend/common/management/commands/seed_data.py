"""
Django management command to seed the database with test data.

Usage:
    python manage.py seed_data                    # Seed all data
    python manage.py seed_data --type=general     # Seed general inventory data
    python manage.py seed_data --type=pharmacy     # Seed pharmacy data
    python manage.py seed_data --type=all         # Seed all types
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from users.models import User
from tenants.models import Tenant, Membership
from inventory.models import Product, StockMovement
from sales.models import Customer, Order, OrderItem
from procurement.models import Supplier, PurchaseOrder, PurchaseRequest
from warehouse.models import Warehouse, Transfer
from finance.models import CostCenter, Expense


class Command(BaseCommand):
    help = 'Seed the database with test data for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['general', 'pharmacy', 'all'],
            default='all',
            help='Type of data to seed (default: all)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip creating data if it already exists',
        )

    def handle(self, *args, **options):
        seed_type = options['type']
        skip_existing = options['skip_existing']

        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('🌱 SEEDING DATABASE WITH TEST DATA'))
        self.stdout.write(self.style.SUCCESS('='*80))

        if seed_type in ['general', 'all']:
            self.seed_general_data(skip_existing)

        if seed_type in ['pharmacy', 'all']:
            self.seed_pharmacy_data(skip_existing)

        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('🎉 SEED DATA COMPLETE!'))
        self.stdout.write(self.style.SUCCESS('='*80))

    def seed_general_data(self, skip_existing=False):
        """Seed general inventory management data"""
        self.stdout.write(self.style.SUCCESS('\n📦 Seeding General Inventory Data...\n'))

        # Create Tenants
        self.stdout.write('1️⃣  Getting or Creating Tenants...')
        tenant1, created = Tenant.objects.get_or_create(
            code="demo-manufacturing",
            defaults={
                'name': "Demo Manufacturing Co",
                'domain': "demo.invpro360.com",
                'is_active': True
            }
        )
        self.stdout.write(f"   ✅ {tenant1.name} {'[CREATED]' if created else '[EXISTS]'}")

        tenant2, created = Tenant.objects.get_or_create(
            code="test-wholesale",
            defaults={
                'name': "Test Wholesale Inc",
                'domain': "test.invpro360.com",
                'is_active': True
            }
        )
        self.stdout.write(f"   ✅ {tenant2.name} {'[CREATED]' if created else '[EXISTS]'}")

        # Create Users
        self.stdout.write('\n2️⃣  Creating Users...')
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
            self.stdout.write(f"   ✅ {user1.email} (Password: Demo123456) [CREATED]")
        else:
            self.stdout.write(f"   ✅ {user1.email} (using existing user)")

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
            self.stdout.write(f"   ✅ {user2.email} (Password: Test123456) [CREATED]")
        else:
            self.stdout.write(f"   ✅ {user2.email} (using existing user)")

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
            self.stdout.write(f"   ✅ {user3.email} (Password: Multi123456) - Multi-tenant [CREATED]")
        else:
            self.stdout.write(f"   ✅ {user3.email} (using existing user) - Multi-tenant")

        # Create Memberships
        self.stdout.write('\n3️⃣  Creating Memberships...')
        Membership.objects.get_or_create(user=user1, tenant=tenant1, defaults={'role': 'admin', 'is_active': True})
        self.stdout.write(f"   ✅ {user1.email} → {tenant1.name} (admin)")

        Membership.objects.get_or_create(user=user2, tenant=tenant2, defaults={'role': 'admin', 'is_active': True})
        self.stdout.write(f"   ✅ {user2.email} → {tenant2.name} (admin)")

        Membership.objects.get_or_create(user=user3, tenant=tenant1, defaults={'role': 'staff', 'is_active': True})
        Membership.objects.get_or_create(user=user3, tenant=tenant2, defaults={'role': 'manager', 'is_active': True})
        self.stdout.write(f"   ✅ {user3.email} → Both tenants (staff/manager)")

        # Create Warehouses
        self.stdout.write('\n4️⃣  Creating Warehouses...')
        wh1_t1, created = Warehouse.objects.get_or_create(
            tenant_id=tenant1.id,
            warehouse_code='WH-001',
            defaults={
                'name': "Central Distribution Center",
                'location': "New York, NY",
                'max_capacity': 1000,
                'current_utilization': 850,
                'active_clients': 12,
                'total_skus': 450,
                'status': "active"
            }
        )
        self.stdout.write(f"   ✅ {wh1_t1.warehouse_code} - {wh1_t1.name}")

        wh2_t1, created = Warehouse.objects.get_or_create(
            tenant_id=tenant1.id,
            warehouse_code='WH-002',
            defaults={
                'name': "West Coast Hub",
                'location': "Los Angeles, CA",
                'max_capacity': 800,
                'current_utilization': 550,
                'active_clients': 8,
                'total_skus': 320,
                'status': "active"
            }
        )
        self.stdout.write(f"   ✅ {wh2_t1.warehouse_code} - {wh2_t1.name}")

        wh1_t2, created = Warehouse.objects.get_or_create(
            tenant_id=tenant2.id,
            warehouse_code='WH-003',
            defaults={
                'name': "Main Warehouse",
                'location': "Chicago, IL",
                'max_capacity': 1200,
                'current_utilization': 900,
                'active_clients': 15,
                'total_skus': 580,
                'status': "active"
            }
        )
        self.stdout.write(f"   ✅ {wh1_t2.warehouse_code} - {wh1_t2.name}")

        # Create Suppliers
        self.stdout.write('\n5️⃣  Creating Suppliers...')
        suppliers_t1 = []
        supplier_data = [
            ("Global Supplies Inc", "James Wilson", "james@globalsupplies.com", "+1-555-123-4567", "123 Industrial Blvd, NY", 4.8),
            ("TechWarehouse Ltd", "Lisa Anderson", "lisa@techwarehouse.com", "+1-555-234-5678", "456 Tech Park, SF", 4.6),
            ("Industrial Parts Co", "Robert Martinez", "robert@industrialparts.com", "+1-555-345-6789", "789 Manufacturing Dr, Chicago", 4.9),
        ]

        for name, contact, email, phone, address, rating in supplier_data:
            supplier, created = Supplier.objects.get_or_create(
                tenant_id=tenant1.id,
                name=name,
                defaults={
                    'contact_person': contact,
                    'email': email,
                    'phone': phone,
                    'address': address,
                    'rating': Decimal(str(rating))
                }
            )
            suppliers_t1.append(supplier)
            self.stdout.write(f"   ✅ {supplier.supplier_code} - {supplier.name}")

        # Create Products
        self.stdout.write('\n6️⃣  Creating Products...')
        products_t1 = []
        product_data = [
            ("Industrial Steel Pipes", "ISP-2024-001", "Raw Materials", "pcs", 450, 100, 45.99, 65.00),
            ("Hydraulic Pumps", "HP-2024-002", "Equipment", "pcs", 75, 50, 289.99, 420.00),
            ("Safety Helmets", "SH-2024-003", "Safety Equipment", "pcs", 15, 200, 12.99, 25.00),
            ("Electric Motors", "EM-2024-004", "Equipment", "pcs", 120, 30, 456.50, 650.00),
            ("Copper Wiring", "CW-2024-005", "Raw Materials", "meters", 850, 500, 3.25, 5.50),
            ("Industrial Bearings", "IB-2024-006", "Parts", "pcs", 300, 100, 15.75, 28.00),
            ("Hydraulic Fluid", "HF-2024-007", "Consumables", "liters", 0, 50, 8.50, 15.00),
            ("Welding Rods", "WR-2024-008", "Consumables", "kg", 45, 200, 12.00, 22.00),
        ]

        for name, sku, category, unit, qty, reorder, cost, price in product_data:
            product, created = Product.objects.get_or_create(
                tenant_id=tenant1.id,
                sku=sku,
                defaults={
                    'name': name,
                    'category': category,
                    'unit': unit,
                    'quantity': qty,
                    'reorder_level': reorder,
                    'unit_cost': Decimal(str(cost)),
                    'selling_price': Decimal(str(price)),
                    'supplier': suppliers_t1[0] if suppliers_t1 else None,
                    'description': f"High quality {name.lower()} for industrial use",
                    'status': "active"
                }
            )
            products_t1.append(product)
            status_emoji = "📦" if qty > reorder else "⚠️" if qty > 0 else "❌"
            self.stdout.write(f"   {status_emoji} {product.product_code} - {product.name} ({qty} {unit})")

        # Create Customers
        self.stdout.write('\n7️⃣  Creating Customers...')
        customers_t1 = []
        customer_data = [
            ("Acme Corporation", "orders@acme.com", "+1-555-111-2222", "100 Business St, NY"),
            ("TechStart Inc", "purchasing@techstart.com", "+1-555-222-3333", "200 Tech Ave, SF"),
            ("Global Retail Ltd", "orders@globalretail.com", "+1-555-333-4444", "300 Commerce Blvd, LA"),
            ("Metro Supplies", "contact@metrosupplies.com", "+1-555-444-5555", "400 Supply Lane, Chicago"),
            ("Prime Distributors", "sales@primedist.com", "+1-555-555-6666", "500 Distribution Way, Dallas"),
        ]

        for name, email, phone, address in customer_data:
            customer, created = Customer.objects.get_or_create(
                tenant_id=tenant1.id,
                email=email,
                defaults={
                    'name': name,
                    'phone': phone,
                    'address': address
                }
            )
            customers_t1.append(customer)
            self.stdout.write(f"   ✅ {customer.customer_code} - {customer.name}")

        # Create Orders
        self.stdout.write('\n8️⃣  Creating Orders...')
        orders_t1 = []
        order_statuses = ['delivered', 'shipped', 'processing', 'pending', 'delivered']

        for i, customer in enumerate(customers_t1):
            order, created = Order.objects.get_or_create(
                tenant_id=tenant1.id,
                customer=customer,
                defaults={
                    'channel': 'shopify' if i % 2 == 0 else 'manual',
                    'total_amount': Decimal('0.00'),
                    'status': order_statuses[i],
                    'fulfilled_at': timezone.now() - timedelta(days=i) if order_statuses[i] == 'delivered' else None
                }
            )

            if created:
                # Add items to order
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

                order.total_amount = total
                order.save()

            orders_t1.append(order)
            self.stdout.write(f"   ✅ {order.order_number} - {customer.name} (${order.total_amount}) [{order.status}]")

        # Create Purchase Orders
        self.stdout.write('\n9️⃣  Creating Purchase Orders...')
        po_statuses = ['delivered', 'in-transit', 'processing', 'pending']

        for i, supplier in enumerate(suppliers_t1):
            po, created = PurchaseOrder.objects.get_or_create(
                tenant_id=tenant1.id,
                supplier=supplier,
                defaults={
                    'total_amount': Decimal(f'{5000 + (i * 2500)}.00'),
                    'expected_delivery_date': (timezone.now() + timedelta(days=7 + i)).date(),
                    'status': po_statuses[i % len(po_statuses)]
                }
            )
            self.stdout.write(f"   ✅ {po.po_number} - {supplier.name} (${po.total_amount}) [{po.status}]")

        # Create Purchase Requests
        self.stdout.write('\n🔟 Creating Purchase Requests...')
        for i, product in enumerate(products_t1[:4]):
            pr, created = PurchaseRequest.objects.get_or_create(
                tenant_id=tenant1.id,
                item=product,
                requested_by=user1,
                defaults={
                    'quantity': 100 + (i * 50),
                    'status': ['pending', 'approved', 'pending', 'rejected'][i]
                }
            )
            self.stdout.write(f"   ✅ {pr.request_number} - {product.name} (Qty: {pr.quantity}) [{pr.status}]")

        # Create Cost Centers
        self.stdout.write('\n1️⃣1️⃣  Creating Cost Centers...')
        cost_centers = [
            ("Warehouse Operations", 150000, 142500),
            ("Procurement", 200000, 215000),
            ("Sales & Marketing", 100000, 98500),
            ("Logistics & Shipping", 120000, 125000),
            ("IT & Systems", 80000, 76000),
        ]

        for name, budget, actual in cost_centers:
            cc, created = CostCenter.objects.get_or_create(
                tenant_id=tenant1.id,
                name=name,
                defaults={
                    'budget': Decimal(str(budget)),
                    'actual_cost': Decimal(str(actual))
                }
            )
            variance = actual - budget
            self.stdout.write(f"   ✅ {cc.name} (Budget: ${budget:,}, Actual: ${actual:,}, Variance: ${variance:+,})")

        # Create Expenses
        self.stdout.write('\n1️⃣2️⃣  Creating Expenses...')
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
            expense, created = Expense.objects.get_or_create(
                tenant_id=tenant1.id,
                description=desc,
                date=(timezone.now() - timedelta(days=30-i*4)).date(),
                defaults={
                    'category': category,
                    'amount': Decimal(str(amount)),
                    'linked_order': linked_order
                }
            )
            linked = f"→ {linked_order.order_number}" if linked_order else ""
            self.stdout.write(f"   ✅ ${amount:,} - {desc} {linked}")

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('📊 GENERAL DATA SUMMARY'))
        self.stdout.write(self.style.SUCCESS('='*80))
        self.stdout.write(f"\n✅ Tenants: {Tenant.objects.count()}")
        self.stdout.write(f"✅ Users: {User.objects.count()}")
        self.stdout.write(f"✅ Products: {Product.objects.filter(tenant_id=tenant1.id).count()}")
        self.stdout.write(f"✅ Customers: {Customer.objects.filter(tenant_id=tenant1.id).count()}")
        self.stdout.write(f"✅ Orders: {Order.objects.filter(tenant_id=tenant1.id).count()}")
        self.stdout.write(f"✅ Suppliers: {Supplier.objects.filter(tenant_id=tenant1.id).count()}")
        self.stdout.write(f"✅ Warehouses: {Warehouse.objects.filter(tenant_id=tenant1.id).count()}")

        self.stdout.write(self.style.SUCCESS('\n🔑 Login Credentials:'))
        self.stdout.write(f"   Email: demo@example.com / Password: Demo123456")
        self.stdout.write(f"   Email: test@example.com / Password: Test123456")
        self.stdout.write(f"   Email: multi@example.com / Password: Multi123456")

    def seed_pharmacy_data(self, skip_existing=False):
        """Seed pharmacy-specific data"""
        self.stdout.write(self.style.SUCCESS('\n💊 Seeding Pharmacy Data...\n'))

        try:
            from pharma.models import DrugProduct, PackagingLevel, DrugBatch, DrugInventory
            from warehouse.models import Warehouse
            from procurement.models import Supplier
        except ImportError:
            self.stdout.write(self.style.WARNING('⚠️  Pharmacy module not available. Skipping pharmacy data.'))
            return

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
            self.stdout.write(f"✅ Created tenant: {tenant.name}")
        else:
            if tenant.industry != 'pharmacy':
                tenant.industry = 'pharmacy'
                tenant.save()
                self.stdout.write(f"✅ Updated tenant industry to: pharmacy")

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
            self.stdout.write(f"✅ Created user: {user.email} (password: Pharma123456)")

        # Create membership
        Membership.objects.get_or_create(
            user=user,
            tenant=tenant,
            defaults={'role': 'admin', 'is_active': True}
        )

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

        self.stdout.write(self.style.SUCCESS('\n✅ Pharmacy data seeding complete!'))
        self.stdout.write(f"   - Tenant: {tenant.name}")
        self.stdout.write(f"   - User: {user.email} / Pharma123456")
        self.stdout.write(f"   - Drugs: {DrugProduct.objects.filter(tenant_id=tenant.id).count()}")

