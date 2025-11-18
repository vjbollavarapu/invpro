"""
Pytest configuration and fixtures for backend tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from tenants.models import Tenant, Membership
from inventory.models import Product
from sales.models import Customer, Order, OrderItem
from procurement.models import Supplier, PurchaseOrder, PurchaseRequest
from warehouse.models import Warehouse, Transfer
from finance.models import CostCenter, Expense

User = get_user_model()


@pytest.fixture
def api_client():
    """API client for making requests"""
    return APIClient()


@pytest.fixture
def tenant1(db):
    """First test tenant"""
    return Tenant.objects.create(
        name="Test Company 1",
        code="test-company-1",
        is_active=True
    )


@pytest.fixture
def tenant2(db):
    """Second test tenant for isolation testing"""
    return Tenant.objects.create(
        name="Test Company 2",
        code="test-company-2",
        is_active=True
    )


@pytest.fixture
def user1(db):
    """First test user"""
    return User.objects.create_user(
        username='testuser1',
        email='test1@example.com',
        password='TestPass123',
        first_name='Test',
        last_name='User1'
    )


@pytest.fixture
def user2(db):
    """Second test user"""
    return User.objects.create_user(
        username='testuser2',
        email='test2@example.com',
        password='TestPass123',
        first_name='Test',
        last_name='User2'
    )


@pytest.fixture
def membership1(db, user1, tenant1):
    """Membership for user1 in tenant1"""
    return Membership.objects.create(
        user=user1,
        tenant=tenant1,
        role='admin',
        is_active=True
    )


@pytest.fixture
def membership2(db, user2, tenant2):
    """Membership for user2 in tenant2"""
    return Membership.objects.create(
        user=user2,
        tenant=tenant2,
        role='staff',
        is_active=True
    )


@pytest.fixture
def authenticated_client1(api_client, user1, membership1):
    """Authenticated API client for user1/tenant1"""
    api_client.force_authenticate(user=user1)
    api_client.credentials(HTTP_X_TENANT_ID=str(membership1.tenant.id))
    return api_client


@pytest.fixture
def authenticated_client2(api_client, user2, membership2):
    """Authenticated API client for user2/tenant2"""
    api_client.force_authenticate(user=user2)
    api_client.credentials(HTTP_X_TENANT_ID=str(membership2.tenant.id))
    return api_client


@pytest.fixture
def product_tenant1(db, tenant1):
    """Test product for tenant1"""
    return Product.objects.create(
        tenant=tenant1,
        name="Test Product T1",
        sku="TST-T1-001",
        unit="pcs",
        quantity=100,
        unit_cost=50.00,
        reorder_level=20
    )


@pytest.fixture
def product_tenant2(db, tenant2):
    """Test product for tenant2"""
    return Product.objects.create(
        tenant=tenant2,
        name="Test Product T2",
        sku="TST-T2-001",
        unit="pcs",
        quantity=200,
        unit_cost=75.00,
        reorder_level=30
    )


@pytest.fixture
def customer_tenant1(db, tenant1):
    """Test customer for tenant1"""
    return Customer.objects.create(
        tenant=tenant1,
        name="Test Customer T1",
        email="customer.t1@example.com",
        phone="+1234567890"
    )


@pytest.fixture
def supplier_tenant1(db, tenant1):
    """Test supplier for tenant1"""
    return Supplier.objects.create(
        tenant=tenant1,
        name="Test Supplier T1",
        contact_person="John Doe",
        email="supplier@example.com",
        rating=4.5
    )


@pytest.fixture
def warehouse_tenant1(db, tenant1):
    """Test warehouse for tenant1"""
    return Warehouse.objects.create(
        tenant=tenant1,
        name="Test Warehouse T1",
        location="New York, NY",
        max_capacity=1000,
        current_utilization=500,
        status="active"
    )


@pytest.fixture
def cost_center_tenant1(db, tenant1):
    """Test cost center for tenant1"""
    return CostCenter.objects.create(
        tenant=tenant1,
        name="Operations",
        budget=50000.00,
        actual_cost=45000.00
    )

