"""Viewsets exposing Shopify inventory data."""

from __future__ import annotations

from rest_framework import permissions, viewsets

from ..models import ShopifyInventoryLevel
from ..serializers import ShopifyInventorySerializer


class ShopifyInventoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopifyInventorySerializer
    queryset = ShopifyInventoryLevel.objects.select_related('integration')
    filterset_fields = ['shopify_location_id']
    search_fields = ['sku', 'shopify_inventory_item_id']
    ordering_fields = ['available', 'incoming', 'shopify_updated_at']
    ordering = ['-shopify_updated_at']

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant_id=getattr(tenant, 'id', tenant))
        return qs
