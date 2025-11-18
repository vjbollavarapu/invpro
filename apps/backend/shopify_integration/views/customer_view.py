"""Viewsets exposing Shopify customer data."""

from __future__ import annotations

from rest_framework import permissions, viewsets

from ..models import ShopifyCustomer
from ..serializers import ShopifyCustomerSerializer


class ShopifyCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopifyCustomerSerializer
    queryset = ShopifyCustomer.objects.select_related('integration')
    filterset_fields = ['state']
    search_fields = ['email', 'first_name', 'last_name', 'shopify_customer_id']
    ordering_fields = ['orders_count', 'total_spent', 'updated_at']
    ordering = ['-total_spent']

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant_id=getattr(tenant, 'id', tenant))
        return qs
