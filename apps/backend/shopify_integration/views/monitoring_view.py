"""API endpoints for monitoring sync health and metrics."""

from __future__ import annotations

import logging
import uuid
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ShopifyIntegration,
    ShopifyInventoryLevel,
    ShopifyProduct,
    ShopifySyncLog,
    SyncQueueItem,
)

logger = logging.getLogger(__name__)


class MonitoringView(APIView):
    """API endpoint for monitoring sync health and metrics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get sync health and metrics."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get metrics
        metrics = self._calculate_metrics(integration)
        health = self._calculate_health(integration)

        return Response(
            {
                "integration": {
                    "store_url": integration.store_url,
                    "status": integration.status,
                    "is_connected": integration.is_connected,
                    "auto_sync_enabled": integration.auto_sync_enabled,
                },
                "health": health,
                "metrics": metrics,
            },
            status=status.HTTP_200_OK,
        )

    def _calculate_health(self, integration: ShopifyIntegration) -> dict:
        """Calculate sync health status."""
        now = timezone.now()
        last_sync = integration.last_successful_sync
        sync_frequency = integration.sync_frequency_minutes or 15

        # Check if sync is overdue
        is_overdue = False
        if last_sync:
            expected_next_sync = last_sync + timedelta(minutes=sync_frequency)
            is_overdue = now > expected_next_sync

        # Check for recent errors
        recent_errors = integration.error_count > 0
        has_failed_items = (
            ShopifyProduct.objects.filter(
                integration=integration, sync_status='error'
            ).exists()
            or ShopifyInventoryLevel.objects.filter(
                integration=integration, sync_status='error'
            ).exists()
        )

        # Check queue status
        queue_stats = SyncQueueItem.objects.filter(integration=integration).aggregate(
            pending=Count('id', filter=Q(status=SyncQueueItem.STATUS_PENDING)),
            failed=Count('id', filter=Q(status=SyncQueueItem.STATUS_FAILED)),
        )

        # Determine overall health
        health_status = "healthy"
        if integration.status == ShopifyIntegration.STATUS_ERROR:
            health_status = "error"
        elif has_failed_items or queue_stats['failed'] > 0:
            health_status = "degraded"
        elif is_overdue and integration.auto_sync_enabled:
            health_status = "warning"
        elif recent_errors:
            health_status = "warning"

        return {
            "status": health_status,
            "last_sync": last_sync.isoformat() if last_sync else None,
            "is_overdue": is_overdue,
            "has_errors": recent_errors,
            "error_count": integration.error_count,
            "has_failed_items": has_failed_items,
            "queue": {
                "pending": queue_stats['pending'] or 0,
                "failed": queue_stats['failed'] or 0,
            },
        }

    def _calculate_metrics(self, integration: ShopifyIntegration) -> dict:
        """Calculate sync metrics."""
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        # Sync log metrics
        recent_logs = ShopifySyncLog.objects.filter(
            integration=integration,
            started_at__gte=last_24h,
        )

        total_syncs = recent_logs.count()
        successful_syncs = recent_logs.filter(status=ShopifySyncLog.STATUS_SUCCESS).count()
        failed_syncs = recent_logs.filter(status=ShopifySyncLog.STATUS_ERROR).count()

        # Product metrics
        product_stats = ShopifyProduct.objects.filter(integration=integration).aggregate(
            total=Count('id'),
            synced=Count('id', filter=Q(sync_status='synced')),
            pending=Count('id', filter=Q(sync_status='pending')),
            error=Count('id', filter=Q(sync_status='error')),
            conflict=Count('id', filter=Q(sync_status='conflict')),
            pending_push=Count('id', filter=Q(pending_push=True)),
        )

        # Inventory metrics
        inventory_stats = ShopifyInventoryLevel.objects.filter(
            integration=integration
        ).aggregate(
            total=Count('id'),
            synced=Count('id', filter=Q(sync_status='synced')),
            pending=Count('id', filter=Q(sync_status='pending')),
            error=Count('id', filter=Q(sync_status='error')),
            pending_push=Count('id', filter=Q(pending_push=True)),
        )

        # Order metrics (last 7 days)
        order_logs = ShopifySyncLog.objects.filter(
            integration=integration,
            entity=ShopifySyncLog.ENTITY_ORDERS,
            started_at__gte=last_7d,
        ).aggregate(
            total_orders=Count('id'),
            total_processed=Count('records_processed'),
        )

        return {
            "syncs_24h": {
                "total": total_syncs,
                "successful": successful_syncs,
                "failed": failed_syncs,
                "success_rate": (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0,
            },
            "products": {
                "total": product_stats['total'] or 0,
                "synced": product_stats['synced'] or 0,
                "pending": product_stats['pending'] or 0,
                "error": product_stats['error'] or 0,
                "conflict": product_stats['conflict'] or 0,
                "pending_push": product_stats['pending_push'] or 0,
            },
            "inventory": {
                "total": inventory_stats['total'] or 0,
                "synced": inventory_stats['synced'] or 0,
                "pending": inventory_stats['pending'] or 0,
                "error": inventory_stats['error'] or 0,
                "pending_push": inventory_stats['pending_push'] or 0,
            },
            "orders_7d": {
                "syncs": order_logs['total_orders'] or 0,
                "processed": order_logs['total_processed'] or 0,
            },
        }

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

        raise PermissionError("Tenant context required for monitoring.")


class RetryView(APIView):
    """API endpoint for retrying failed operations."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Retry failed push operations."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        entity_type = request.data.get("entity_type", "all")
        max_retries = request.data.get("max_retries", 3)

        from ..services import RetryService

        retry_service = RetryService(integration)

        try:
            if entity_type == "products":
                results = retry_service.retry_failed_products(max_retries)
            elif entity_type == "inventory":
                results = retry_service.retry_failed_inventory(max_retries)
            else:
                results = retry_service.retry_all_failed(max_retries)

            return Response(
                {
                    "success": results.get("total_failed", results.get("failed", 0)) == 0,
                    "message": f"Retry completed: {results.get('total_succeeded', results.get('succeeded', 0))} succeeded, {results.get('total_failed', results.get('failed', 0))} failed",
                    "results": results,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Error retrying failed operations")
            return Response(
                {"error": f"Retry failed: {str(e)}"},
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

        raise PermissionError("Tenant context required for retry operations.")


class QueueView(APIView):
    """API endpoint for managing sync queue."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get queue status and items."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        from ..services import SyncQueueService

        queue_service = SyncQueueService(integration)
        stats = queue_service.get_queue_stats()

        # Get recent queue items
        status_filter = request.query_params.get("status", "pending")
        limit = int(request.query_params.get("limit", 20))

        items = SyncQueueItem.objects.filter(integration=integration)
        if status_filter != "all":
            items = items.filter(status=status_filter)

        items = items.order_by("-priority", "created_at")[:limit]

        return Response(
            {
                "stats": stats,
                "items": [
                    {
                        "id": item.id,
                        "operation": item.operation,
                        "entity_type": item.entity_type,
                        "entity_id": item.entity_id,
                        "priority": item.get_priority_display(),
                        "status": item.get_status_display(),
                        "retry_count": item.retry_count,
                        "scheduled_at": item.scheduled_at.isoformat() if item.scheduled_at else None,
                        "created_at": item.created_at.isoformat(),
                        "error_message": item.error_message,
                    }
                    for item in items
                ],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        """Process next item in queue."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        from ..services import SyncQueueService

        queue_service = SyncQueueService(integration)
        item = queue_service.process_next()

        if not item:
            return Response(
                {"message": "No pending items in queue"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "success": item.status == SyncQueueItem.STATUS_COMPLETED,
                "item_id": item.id,
                "operation": item.operation,
                "status": item.get_status_display(),
                "error_message": item.error_message if item.status == SyncQueueItem.STATUS_FAILED else None,
            },
            status=status.HTTP_200_OK,
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

        raise PermissionError("Tenant context required for queue operations.")

