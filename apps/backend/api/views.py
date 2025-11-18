"""
Central API views for dashboard statistics and multi-tenant management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import timedelta

from inventory.models import Product, StockMovement
from sales.models import Order, Customer
from procurement.models import PurchaseOrder, Supplier, PurchaseRequest
from warehouse.models import Warehouse, Transfer
from finance.models import CostCenter, Expense
from notifications.models import Notification
from tenants.models import Tenant, Membership
from users.models import User


class DashboardViewSet(viewsets.ViewSet):
    """
    Tenant-scoped dashboard statistics and analytics.
    Returns aggregated data for the current tenant only.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_tenant(self):
        """Get current tenant from request"""
        return getattr(self.request, 'tenant', None)
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Get overall dashboard statistics for tenant.
        GET /api/dashboard/overview/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate statistics
        products = Product.objects.filter(tenant_id=tenant.id)
        orders = Order.objects.filter(tenant_id=tenant.id)
        warehouses = Warehouse.objects.filter(tenant_id=tenant.id)
        cost_centers = CostCenter.objects.filter(tenant_id=tenant.id)
        
        # Total stock value
        total_stock_value = sum(p.quantity * p.unit_cost for p in products)
        
        # Low stock items
        low_stock_count = products.filter(
            quantity__lte=F('reorder_level'),
            quantity__gt=0
        ).count() if products.exists() else 0
        
        # Out of stock
        out_of_stock_count = products.filter(quantity=0).count()
        
        # Recent orders (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders = orders.filter(created_at__gte=thirty_days_ago)
        pending_orders = orders.filter(status='pending').count()
        
        # Total revenue (last 30 days)
        revenue = recent_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Purchase requests pending approval
        pending_prs = PurchaseRequest.objects.filter(
            tenant_id=tenant.id, 
            status='pending'
        ).count()
        
        # Budget variance
        budget_variance = cost_centers.aggregate(
            variance=Sum(F('actual_cost') - F('budget'))
        )['variance'] or 0
        
        return Response({
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'code': tenant.code,
            },
            'metrics': {
                'total_stock_value': float(total_stock_value),
                'active_warehouses': warehouses.filter(status='active').count(),
                'pending_orders': pending_orders,
                'purchase_requests': pending_prs,
                'low_stock_items': low_stock_count,
                'out_of_stock_items': out_of_stock_count,
                'recent_revenue_30d': float(revenue),
                'budget_variance': float(budget_variance),
            },
            'stats': {
                'total_products': products.count(),
                'total_customers': Customer.objects.filter(tenant_id=tenant.id).count(),
                'total_suppliers': Supplier.objects.filter(tenant_id=tenant.id).count(),
                'total_warehouses': warehouses.count(),
                'total_orders': orders.count(),
                'recent_orders_30d': recent_orders.count(),
            }
        })
    
    @action(detail=False, methods=['get'])
    def inventory_stats(self, request):
        """
        Get inventory-specific dashboard stats.
        GET /api/dashboard/inventory_stats/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        products = Product.objects.filter(tenant_id=tenant.id)
        
        # Stock status breakdown
        in_stock = products.filter(quantity__gt=F('reorder_level')).count()
        low_stock = products.filter(
            quantity__lte=F('reorder_level'), 
            quantity__gt=0
        ).count()
        out_of_stock = products.filter(quantity=0).count()
        
        # By category
        by_category = products.values('category').annotate(
            count=Count('id'),
            total_value=Sum(F('quantity') * F('unit_cost'))
        )
        
        # Recent stock movements (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_movements = StockMovement.objects.filter(
            tenant_id=tenant.id,
            timestamp__gte=seven_days_ago
        ).count()
        
        return Response({
            'total_products': products.count(),
            'total_stock_value': sum(p.quantity * p.unit_cost for p in products),
            'stock_status': {
                'in_stock': in_stock,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
            },
            'by_category': list(by_category),
            'recent_movements_7d': recent_movements,
        })
    
    @action(detail=False, methods=['get'])
    def sales_stats(self, request):
        """
        Get sales-specific dashboard stats.
        GET /api/dashboard/sales_stats/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        orders = Order.objects.filter(tenant_id=tenant.id)
        
        # Status breakdown
        by_status = orders.values('status').annotate(count=Count('id'))
        
        # Last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders = orders.filter(created_at__gte=thirty_days_ago)
        recent_revenue = recent_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Top customers
        top_customers = Customer.objects.filter(tenant_id=tenant.id).annotate(
            order_count=Count('orders'),
            total_revenue=Sum('orders__total_amount')
        ).order_by('-total_revenue')[:5]
        
        return Response({
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(total=Sum('total_amount'))['total'] or 0,
            'recent_orders_30d': recent_orders.count(),
            'recent_revenue_30d': float(recent_revenue),
            'by_status': list(by_status),
            'top_customers': [{
                'id': c.id,
                'customer_code': c.customer_code,
                'name': c.name,
                'order_count': c.order_count,
                'total_revenue': float(c.total_revenue or 0),
            } for c in top_customers],
        })
    
    @action(detail=False, methods=['get'])
    def procurement_stats(self, request):
        """
        Get procurement-specific dashboard stats.
        GET /api/dashboard/procurement_stats/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        purchase_orders = PurchaseOrder.objects.filter(tenant_id=tenant.id)
        purchase_requests = PurchaseRequest.objects.filter(tenant_id=tenant.id)
        suppliers = Supplier.objects.filter(tenant_id=tenant.id)
        
        # PO status breakdown
        po_by_status = purchase_orders.values('status').annotate(count=Count('id'))
        
        # PR status breakdown
        pr_by_status = purchase_requests.values('status').annotate(count=Count('id'))
        
        # Top suppliers
        top_suppliers = suppliers.annotate(
            po_count=Count('purchase_orders'),
            total_spent=Sum('purchase_orders__total_amount')
        ).order_by('-total_spent')[:5]
        
        return Response({
            'total_suppliers': suppliers.count(),
            'total_purchase_orders': purchase_orders.count(),
            'total_purchase_requests': purchase_requests.count(),
            'pending_approvals': purchase_requests.filter(status='pending').count(),
            'po_by_status': list(po_by_status),
            'pr_by_status': list(pr_by_status),
            'top_suppliers': [{
                'id': s.id,
                'supplier_code': s.supplier_code,
                'name': s.name,
                'po_count': s.po_count,
                'total_spent': float(s.total_spent or 0),
                'rating': float(s.rating),
            } for s in top_suppliers],
        })
    
    @action(detail=False, methods=['get'])
    def warehouse_stats(self, request):
        """
        Get warehouse-specific dashboard stats.
        GET /api/dashboard/warehouse_stats/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        warehouses = Warehouse.objects.filter(tenant_id=tenant.id)
        transfers = Transfer.objects.filter(tenant_id=tenant.id)
        
        # Average capacity utilization
        avg_capacity = warehouses.aggregate(
            avg_util=Avg('current_utilization')
        )['avg_util'] or 0
        
        # Transfer status
        transfer_by_status = transfers.values('status').annotate(count=Count('id'))
        
        return Response({
            'total_warehouses': warehouses.count(),
            'active_warehouses': warehouses.filter(status='active').count(),
            'total_clients': warehouses.aggregate(total=Sum('active_clients'))['total'] or 0,
            'total_skus': warehouses.aggregate(total=Sum('total_skus'))['total'] or 0,
            'avg_capacity_utilization': float(avg_capacity),
            'total_transfers': transfers.count(),
            'transfer_by_status': list(transfer_by_status),
        })
    
    @action(detail=False, methods=['get'])
    def finance_stats(self, request):
        """
        Get finance-specific dashboard stats.
        GET /api/dashboard/finance_stats/
        """
        tenant = self.get_tenant()
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        cost_centers = CostCenter.objects.filter(tenant_id=tenant.id)
        expenses = Expense.objects.filter(tenant_id=tenant.id)
        
        # Budget summary
        total_budget = cost_centers.aggregate(total=Sum('budget'))['total'] or 0
        total_actual = cost_centers.aggregate(total=Sum('actual_cost'))['total'] or 0
        variance = total_actual - total_budget
        
        # Expenses by category
        by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Recent expenses (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_expenses = expenses.filter(date__gte=thirty_days_ago.date())
        recent_total = recent_expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'total_cost_centers': cost_centers.count(),
            'total_budget': float(total_budget),
            'total_actual_cost': float(total_actual),
            'budget_variance': float(variance),
            'variance_percentage': float((variance / total_budget * 100) if total_budget else 0),
            'total_expenses': expenses.count(),
            'recent_expenses_30d': recent_expenses.count(),
            'recent_total_30d': float(recent_total),
            'by_category': list(by_category),
        })


class MultiTenantManagementViewSet(viewsets.ViewSet):
    """
    Multi-tenant management endpoints.
    For managing tenants, switching contexts, and admin operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_tenants(self, request):
        """
        Get all tenants the current user belongs to.
        GET /api/multi-tenant/my_tenants/
        """
        user = request.user
        memberships = Membership.objects.filter(
            user=user, 
            is_active=True
        ).select_related('tenant')
        
        tenants = [{
            'tenant_id': m.tenant.id,
            'tenant_name': m.tenant.name,
            'tenant_code': m.tenant.code,
            'role': m.role,
            'is_active': m.tenant.is_active,
            'joined_at': m.created_at,
        } for m in memberships]
        
        return Response({
            'count': len(tenants),
            'tenants': tenants,
            'current_tenant_id': request.headers.get('X-Tenant-ID'),
        })
    
    @action(detail=False, methods=['post'])
    def switch_tenant(self, request):
        """
        Validate user has access to a tenant (for tenant switching).
        POST /api/multi-tenant/switch_tenant/
        Body: {"tenant_id": 1}
        """
        user = request.user
        tenant_id = request.data.get('tenant_id')
        
        if not tenant_id:
            return Response({'error': 'tenant_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify user has access
        try:
            membership = Membership.objects.get(
                user=user,
                tenant_id=tenant_id,
                is_active=True,
                tenant__is_active=True
            )
            
            return Response({
                'success': True,
                'tenant': {
                    'id': membership.tenant.id,
                    'name': membership.tenant.name,
                    'code': membership.tenant.code,
                },
                'role': membership.role,
            })
        except Membership.DoesNotExist:
            return Response(
                {'error': 'You do not have access to this tenant'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=False, methods=['get'])
    def tenant_info(self, request):
        """
        Get detailed info about current tenant.
        GET /api/multi-tenant/tenant_info/
        """
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response({'error': 'No tenant specified'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get membership info
        membership = Membership.objects.filter(
            user=request.user,
            tenant_id=tenant.id
        ).first()
        
        # Get tenant statistics
        member_count = Membership.objects.filter(tenant_id=tenant.id, is_active=True).count()
        
        return Response({
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'code': tenant.code,
                'domain': tenant.domain,
                'is_active': tenant.is_active,
                'created_at': tenant.created_at,
            },
            'your_role': membership.role if membership else None,
            'member_count': member_count,
            'total_products': Product.objects.filter(tenant_id=tenant.id).count(),
            'total_orders': Order.objects.filter(tenant_id=tenant.id).count(),
            'total_warehouses': Warehouse.objects.filter(tenant_id=tenant.id).count(),
        })
    
    @action(detail=False, methods=['get'])
    def admin_overview(self, request):
        """
        Cross-tenant statistics (for superusers only).
        GET /api/multi-tenant/admin_overview/
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Superuser access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # System-wide statistics
        total_tenants = Tenant.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True).count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        
        # Tenant breakdown
        tenant_stats = []
        for tenant in Tenant.objects.filter(is_active=True):
            tenant_stats.append({
                'tenant_id': tenant.id,
                'tenant_name': tenant.name,
                'tenant_code': tenant.code,
                'members': Membership.objects.filter(tenant_id=tenant.id, is_active=True).count(),
                'products': Product.objects.filter(tenant_id=tenant.id).count(),
                'orders': Order.objects.filter(tenant_id=tenant.id).count(),
                'warehouses': Warehouse.objects.filter(tenant_id=tenant.id).count(),
                'created_at': tenant.created_at,
            })
        
        return Response({
            'system_stats': {
                'total_tenants': total_tenants,
                'total_users': total_users,
                'total_products': total_products,
                'total_orders': total_orders,
            },
            'tenant_breakdown': tenant_stats,
        })


# Import F for calculated fields
from django.db.models import F
