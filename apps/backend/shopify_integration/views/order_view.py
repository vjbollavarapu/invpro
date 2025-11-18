"""Viewsets exposing Shopify order data."""

from __future__ import annotations

from rest_framework import permissions, viewsets

from ..models import ShopifyOrder
from ..serializers import ShopifyOrderSerializer


class ShopifyOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopifyOrderSerializer
    queryset = ShopifyOrder.objects.select_related('integration')
    filterset_fields = ['financial_status', 'fulfillment_status', 'currency']
    search_fields = ['name', 'shopify_order_id', 'email']
    ordering_fields = ['processed_at', 'total_price', 'updated_at']
    ordering = ['-processed_at']

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant_id=getattr(tenant, 'id', tenant))
        return qs
