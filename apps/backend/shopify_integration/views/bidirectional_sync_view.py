"""API endpoint for bidirectional sync operations."""

from __future__ import annotations

import logging
import uuid
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration
from ..services import BidirectionalSyncService

logger = logging.getLogger(__name__)


class BidirectionalSyncSerializer(serializers.Serializer):
    """Serializer for bidirectional sync request."""
    entity_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['products', 'orders', 'customers', 'inventory']),
        required=False,
        help_text="List of entity types to sync. If not provided, all enabled types will be synced.",
    )
    conflict_strategy = serializers.ChoiceField(
        choices=['last_write_wins', 'use_local', 'use_remote'],
        default='last_write_wins',
        help_text="Strategy for automatically resolving conflicts",
    )
    auto_resolve = serializers.BooleanField(
        default=False,
        help_text="Whether to automatically resolve conflicts using the conflict_strategy",
    )


class BidirectionalSyncView(APIView):
    """API endpoint for bidirectional synchronization."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Perform bidirectional sync."""
        serializer = BidirectionalSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found. Please connect to Shopify first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not integration.is_connected:
            return Response(
                {"error": "Shopify integration is not connected. Please connect first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entity_types = serializer.validated_data.get("entity_types")
        conflict_strategy = serializer.validated_data.get("conflict_strategy", "last_write_wins")
        auto_resolve = serializer.validated_data.get("auto_resolve", False)

        # Filter entity types based on integration settings
        if entity_types is None:
            entity_types = []
            if integration.sync_products:
                entity_types.append('products')
            if integration.sync_orders:
                entity_types.append('orders')
            if integration.sync_customers:
                entity_types.append('customers')
            if integration.sync_inventory:
                entity_types.append('inventory')

        # Initialize bidirectional sync service
        sync_service = BidirectionalSyncService(integration)

        try:
            results = sync_service.sync_full(
                entity_types=entity_types,
                conflict_strategy=conflict_strategy,
                auto_resolve=auto_resolve,
            )

            return Response(
                {
                    "success": results["success"],
                    "message": "Bidirectional sync completed",
                    "pull": results["pull"],
                    "import": results["import"],
                    "push": results["push"],
                    "conflicts": results["conflicts"],
                    "conflict_count": len(results["conflicts"]),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error performing bidirectional sync")
            return Response(
                {"error": f"Bidirectional sync failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @staticmethod
    def _resolve_tenant_id(request):
        """Resolve tenant_id from request. Returns UUID string."""
        tenant = getattr(request, "tenant", None)
        if tenant:
            tenant_id = getattr(tenant, "id", None)
            if tenant_id:
                # Convert integer tenant ID to UUID format
                namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # DNS namespace
                tenant_uuid = uuid.uuid5(namespace, f"tenant_{tenant_id}")
                return str(tenant_uuid)

        if hasattr(request.user, "tenant_id") and request.user.tenant_id:
            return str(request.user.tenant_id)

        raise PermissionError("Tenant context required for bidirectional sync.")

