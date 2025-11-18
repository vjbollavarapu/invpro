"""Viewsets exposing Shopify product data."""

from __future__ import annotations

from rest_framework import permissions, viewsets

from ..models import ShopifyProduct
from ..serializers import ShopifyProductSerializer


class ShopifyProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopifyProductSerializer
    queryset = ShopifyProduct.objects.select_related('integration')
    filterset_fields = ['status', 'vendor', 'product_type']
    search_fields = ['title', 'shopify_product_id', 'handle']
    ordering_fields = ['title', 'synced_at', 'updated_at']
    ordering = ['title']

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant_id=getattr(tenant, 'id', tenant))
        return qs
