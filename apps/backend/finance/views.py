from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import CostCenter, Expense
from .serializers import CostCenterSerializer, ExpenseSerializer, ExpenseCreateSerializer
from inventory.views import TenantScopedMixin


class CostCenterViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Cost Center management.
    """
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get cost center summary statistics"""
        cost_centers = self.get_queryset()
        
        total_budget = cost_centers.aggregate(total=Sum('budget'))['total'] or 0
        total_actual = cost_centers.aggregate(total=Sum('actual_cost'))['total'] or 0
        total_variance = total_actual - total_budget
        
        return Response({
            'total_budget': total_budget,
            'total_actual_cost': total_actual,
            'total_variance': total_variance,
            'variance_percentage': (total_variance / total_budget * 100) if total_budget else 0,
            'cost_center_count': cost_centers.count()
        })


class ExpenseViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Expense tracking.
    """
    queryset = Expense.objects.select_related('linked_order', 'linked_po').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'date']
    search_fields = ['description', 'category']
    ordering = ['-date', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get expenses grouped by category"""
        from django.db.models import Sum
        expenses = self.get_queryset()
        
        by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        return Response(by_category)
