"""API endpoint for resolving sync conflicts."""

from __future__ import annotations

import logging
import uuid
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration, ShopifyProduct
from ..services import ConflictDetectionService

logger = logging.getLogger(__name__)


class ConflictResolutionSerializer(serializers.Serializer):
    """Serializer for conflict resolution request."""
    resolution = serializers.ChoiceField(
        choices=['use_local', 'use_remote', 'merge'],
        required=True,
        help_text="Resolution strategy: use_local, use_remote, or merge",
    )
    resolution_data = serializers.DictField(
        required=False,
        help_text="Additional data for merge resolution (field: value pairs)",
    )


class ConflictResolutionView(APIView):
    """API endpoint for resolving sync conflicts."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get all conflicts for the integration."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        entity_type = kwargs.get("entity_type", "products")
        conflict_detector = ConflictDetectionService(integration)
        conflicts = conflict_detector.detect_all_conflicts(entity_type)

        return Response(
            {
                "conflicts": conflicts,
                "count": len(conflicts),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        """Resolve a specific conflict."""
        serializer = ConflictResolutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        entity_id = kwargs.get("entity_id")
        entity_type = kwargs.get("entity_type", "products")

        if not entity_id:
            return Response(
                {"error": "Entity ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resolution = serializer.validated_data["resolution"]
        resolution_data = serializer.validated_data.get("resolution_data")

        conflict_detector = ConflictDetectionService(integration)

        try:
            if entity_type == "products":
                shopify_product = ShopifyProduct.objects.filter(
                    id=entity_id,
                    integration=integration,
                ).first()

                if not shopify_product:
                    return Response(
                        {"error": "Product not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                conflict_detector.resolve_conflict(shopify_product, resolution, resolution_data)

                return Response(
                    {
                        "success": True,
                        "message": f"Conflict resolved using {resolution} strategy",
                        "entity_type": entity_type,
                        "entity_id": entity_id,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": f"Conflict resolution for {entity_type} is not yet implemented."},
                    status=status.HTTP_501_NOT_IMPLEMENTED,
                )

        except Exception as e:
            logger.exception("Error resolving conflict")
            return Response(
                {"error": f"Failed to resolve conflict: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @staticmethod
    def _resolve_tenant_id(request):
        """Resolve tenant_id from request. Returns UUID string."""
        tenant = getattr(request, "tenant", None)
        if tenant:
            tenant_id = getattr(tenant, "id", None)
            if tenant_id:
                namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
                tenant_uuid = uuid.uuid5(namespace, f"tenant_{tenant_id}")
                return str(tenant_uuid)

        if hasattr(request.user, "tenant_id") and request.user.tenant_id:
            return str(request.user.tenant_id)

        raise PermissionError("Tenant context required for conflict resolution.")

