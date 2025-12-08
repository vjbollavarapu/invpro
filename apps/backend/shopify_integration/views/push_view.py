"""API endpoint for pushing data to Shopify."""

from __future__ import annotations

import logging
import uuid
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration, ShopifyInventoryLevel, ShopifyProduct
from ..services import ShopifyInventoryPushService, ShopifyProductPushService
from ..services.shopify_api_client import ShopifyApiClient

logger = logging.getLogger(__name__)


class PushProductsSerializer(serializers.Serializer):
    """Serializer for push products request."""
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of ShopifyProduct IDs to push. If not provided, all products with pending_push=True will be pushed.",
    )
    force = serializers.BooleanField(
        default=False,
        help_text="Force push even if pending_push is False",
    )


class PushInventorySerializer(serializers.Serializer):
    """Serializer for push inventory request."""
    location_id = serializers.CharField(
        required=True,
        help_text="Shopify location ID",
    )
    updates = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of inventory updates: [{'inventory_item_id': '...', 'quantity': 100}, ...]",
    )
    inventory_level_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of ShopifyInventoryLevel IDs to push. If not provided, all inventory levels with pending_push=True will be pushed.",
    )
    force = serializers.BooleanField(
        default=False,
        help_text="Force push even if pending_push is False",
    )


class ShopifyPushView(APIView):
    """API endpoint for pushing data to Shopify."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Push data to Shopify based on entity type."""
        entity_type = kwargs.get("entity_type", "products")

        if entity_type == "products":
            return self._push_products(request)
        elif entity_type == "inventory":
            return self._push_inventory(request)
        else:
            return Response(
                {"error": f"Invalid entity type: {entity_type}. Supported types: products, inventory"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _push_products(self, request):
        """Push products to Shopify."""
        serializer = PushProductsSerializer(data=request.data)
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

        product_ids = serializer.validated_data.get("product_ids")
        force = serializer.validated_data.get("force", False)

        # Get products to push
        if product_ids:
            products = ShopifyProduct.objects.filter(
                integration=integration,
                id__in=product_ids,
            )
        elif force:
            products = ShopifyProduct.objects.filter(integration=integration)
        else:
            products = ShopifyProduct.objects.filter(
                integration=integration,
                pending_push=True,
            )

        if not products.exists():
            return Response(
                {
                    "message": "No products to push",
                    "pushed": 0,
                    "failed": 0,
                },
                status=status.HTTP_200_OK,
            )

        # Initialize push service
        client = ShopifyApiClient(integration)
        push_service = ShopifyProductPushService(integration, api_client=client)

        try:
            results = push_service.push_batch(products=list(products))

            return Response(
                {
                    "success": results["failed"] == 0,
                    "message": f"Pushed {results['success']} products, {results['failed']} failed",
                    "pushed": results["success"],
                    "failed": results["failed"],
                    "errors": results.get("errors", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error pushing products to Shopify")
            return Response(
                {"error": f"Failed to push products: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _push_inventory(self, request):
        """Push inventory levels to Shopify."""
        serializer = PushInventorySerializer(data=request.data)
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

        # Initialize push service
        client = ShopifyApiClient(integration)
        push_service = ShopifyInventoryPushService(integration, api_client=client)

        try:
            # Check if updates are provided directly
            updates = serializer.validated_data.get("updates")
            if updates:
                location_id = serializer.validated_data["location_id"]
                # Add location_id to each update if not present
                for update in updates:
                    if "location_id" not in update:
                        update["location_id"] = location_id
                results = push_service.push_batch(updates=updates)
            else:
                # Push from inventory level objects
                inventory_level_ids = serializer.validated_data.get("inventory_level_ids")
                force = serializer.validated_data.get("force", False)

                if inventory_level_ids:
                    inventory_levels = ShopifyInventoryLevel.objects.filter(
                        integration=integration,
                        id__in=inventory_level_ids,
                    )
                elif force:
                    inventory_levels = ShopifyInventoryLevel.objects.filter(integration=integration)
                else:
                    inventory_levels = ShopifyInventoryLevel.objects.filter(
                        integration=integration,
                        pending_push=True,
                    )

                if not inventory_levels.exists():
                    return Response(
                        {
                            "message": "No inventory levels to push",
                            "pushed": 0,
                            "failed": 0,
                        },
                        status=status.HTTP_200_OK,
                    )

                results = push_service.push_batch(inventory_levels=list(inventory_levels))

            return Response(
                {
                    "success": results["failed"] == 0,
                    "message": f"Pushed {results['success']} inventory levels, {results['failed']} failed",
                    "pushed": results["success"],
                    "failed": results["failed"],
                    "errors": results.get("errors", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error pushing inventory to Shopify")
            return Response(
                {"error": f"Failed to push inventory: {str(e)}"},
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
                # Using a deterministic UUID v5 based on tenant ID
                namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # DNS namespace
                tenant_uuid = uuid.uuid5(namespace, f"tenant_{tenant_id}")
                return str(tenant_uuid)

        if hasattr(request.user, "tenant_id") and request.user.tenant_id:
            return str(request.user.tenant_id)

        raise PermissionError("Tenant context required for Shopify push operations.")

