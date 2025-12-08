"""API endpoint for importing data from integration tables to common tables."""

from __future__ import annotations

import logging
import uuid
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyCustomer, ShopifyIntegration, ShopifyOrder, ShopifyProduct
from ..services import CustomerImportService, OrderImportService, ProductImportService

logger = logging.getLogger(__name__)


class ImportProductsSerializer(serializers.Serializer):
    """Serializer for import products request."""
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of ShopifyProduct IDs to import. If not provided, all products will be imported.",
    )
    merge_strategy = serializers.ChoiceField(
        choices=["last_write_wins", "skip", "overwrite"],
        default="last_write_wins",
        help_text="Strategy for handling conflicts: last_write_wins (default), skip, or overwrite",
    )


class ImportOrdersSerializer(serializers.Serializer):
    """Serializer for import orders request."""
    order_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of ShopifyOrder IDs to import. If not provided, all orders will be imported.",
    )
    merge_strategy = serializers.ChoiceField(
        choices=["last_write_wins", "skip", "overwrite"],
        default="last_write_wins",
        help_text="Strategy for handling conflicts: last_write_wins (default), skip, or overwrite",
    )


class ImportCustomersSerializer(serializers.Serializer):
    """Serializer for import customers request."""
    customer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of ShopifyCustomer IDs to import. If not provided, all customers will be imported.",
    )
    merge_strategy = serializers.ChoiceField(
        choices=["last_write_wins", "skip", "overwrite"],
        default="last_write_wins",
        help_text="Strategy for handling conflicts: last_write_wins (default), skip, or overwrite",
    )


class ShopifyImportView(APIView):
    """API endpoint for importing data from Shopify integration tables to common tables."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Import data to common tables based on entity type."""
        entity_type = kwargs.get("entity_type", "products")

        if entity_type == "products":
            return self._import_products(request)
        elif entity_type == "orders":
            return self._import_orders(request)
        elif entity_type == "customers":
            return self._import_customers(request)
        else:
            return Response(
                {"error": f"Invalid entity type: {entity_type}. Supported types: products, orders, customers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _import_products(self, request):
        """Import products from ShopifyProduct to Product table."""
        serializer = ImportProductsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found. Please connect to Shopify first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        product_ids = serializer.validated_data.get("product_ids")
        merge_strategy = serializer.validated_data.get("merge_strategy", "last_write_wins")

        # Get products to import
        if product_ids:
            shopify_products = list(
                ShopifyProduct.objects.filter(
                    integration=integration,
                    id__in=product_ids,
                )
            )
        else:
            shopify_products = None  # Will import all

        # Initialize import service
        import_service = ProductImportService(integration)

        try:
            results = import_service.import_batch(shopify_products, merge_strategy)

            return Response(
                {
                    "success": len(results["errors"]) == 0,
                    "message": f"Imported {results['created']} products, updated {results['updated']}, skipped {results['skipped']}",
                    "total": results["total"],
                    "created": results["created"],
                    "updated": results["updated"],
                    "skipped": results["skipped"],
                    "errors": results.get("errors", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error importing products")
            return Response(
                {"error": f"Failed to import products: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _import_orders(self, request):
        """Import orders from ShopifyOrder to Order table."""
        serializer = ImportOrdersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found. Please connect to Shopify first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order_ids = serializer.validated_data.get("order_ids")
        merge_strategy = serializer.validated_data.get("merge_strategy", "last_write_wins")

        # Get orders to import
        if order_ids:
            shopify_orders = list(
                ShopifyOrder.objects.filter(
                    integration=integration,
                    id__in=order_ids,
                )
            )
        else:
            shopify_orders = None  # Will import all

        # Initialize import service
        import_service = OrderImportService(integration)

        try:
            results = import_service.import_batch(shopify_orders, merge_strategy)

            return Response(
                {
                    "success": len(results["errors"]) == 0,
                    "message": f"Imported {results['created']} orders, updated {results['updated']}, skipped {results['skipped']}",
                    "total": results["total"],
                    "created": results["created"],
                    "updated": results["updated"],
                    "skipped": results["skipped"],
                    "errors": results.get("errors", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error importing orders")
            return Response(
                {"error": f"Failed to import orders: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _import_customers(self, request):
        """Import customers from ShopifyCustomer to Customer table."""
        serializer = ImportCustomersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found. Please connect to Shopify first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        customer_ids = serializer.validated_data.get("customer_ids")
        merge_strategy = serializer.validated_data.get("merge_strategy", "last_write_wins")

        # Get customers to import
        if customer_ids:
            shopify_customers = list(
                ShopifyCustomer.objects.filter(
                    integration=integration,
                    id__in=customer_ids,
                )
            )
        else:
            shopify_customers = None  # Will import all

        # Initialize import service
        import_service = CustomerImportService(integration)

        try:
            results = import_service.import_batch(shopify_customers, merge_strategy)

            return Response(
                {
                    "success": len(results["errors"]) == 0,
                    "message": f"Imported {results['created']} customers, updated {results['updated']}, skipped {results['skipped']}",
                    "total": results["total"],
                    "created": results["created"],
                    "updated": results["updated"],
                    "skipped": results["skipped"],
                    "errors": results.get("errors", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error importing customers")
            return Response(
                {"error": f"Failed to import customers: {str(e)}"},
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

        raise PermissionError("Tenant context required for Shopify import operations.")

