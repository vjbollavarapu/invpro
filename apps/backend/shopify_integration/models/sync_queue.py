"""Model for managing sync queue operations."""

from __future__ import annotations

from django.db import models
from django.utils import timezone

from .base import ShopifyBaseModel


class SyncQueueItem(ShopifyBaseModel):
    """Represents a pending sync operation in the queue."""

    PRIORITY_LOW = 1
    PRIORITY_NORMAL = 2
    PRIORITY_HIGH = 3
    PRIORITY_URGENT = 4

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_NORMAL, 'Normal'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_URGENT, 'Urgent'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    OPERATION_PUSH_PRODUCT = 'push_product'
    OPERATION_PUSH_INVENTORY = 'push_inventory'
    OPERATION_PULL_PRODUCTS = 'pull_products'
    OPERATION_PULL_ORDERS = 'pull_orders'
    OPERATION_IMPORT_PRODUCTS = 'import_products'
    OPERATION_BIDIRECTIONAL_SYNC = 'bidirectional_sync'

    OPERATION_CHOICES = [
        (OPERATION_PUSH_PRODUCT, 'Push Product'),
        (OPERATION_PUSH_INVENTORY, 'Push Inventory'),
        (OPERATION_PULL_PRODUCTS, 'Pull Products'),
        (OPERATION_PULL_ORDERS, 'Pull Orders'),
        (OPERATION_IMPORT_PRODUCTS, 'Import Products'),
        (OPERATION_BIDIRECTIONAL_SYNC, 'Bidirectional Sync'),
    ]

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='queue_items',
    )
    operation = models.CharField(
        max_length=50,
        choices=OPERATION_CHOICES,
        help_text="Type of sync operation",
    )
    entity_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Entity type (products, orders, etc.)",
    )
    entity_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the specific entity to sync",
    )
    priority = models.IntegerField(
        choices=PRIORITY_CHOICES,
        default=PRIORITY_NORMAL,
        help_text="Priority level for processing",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of retry attempts",
    )
    max_retries = models.PositiveIntegerField(
        default=3,
        help_text="Maximum number of retry attempts",
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When to process this item",
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When processing started",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When processing completed",
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error message if operation failed",
    )
    operation_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data for the operation",
    )

    class Meta:
        ordering = ['-priority', 'scheduled_at', 'created_at']
        indexes = [
            models.Index(fields=['integration', 'status', 'priority']),
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['tenant_id', 'status']),
        ]
        verbose_name = "Sync Queue Item"
        verbose_name_plural = "Sync Queue Items"

    def __str__(self) -> str:
        return f"{self.operation} - {self.status} (Priority: {self.get_priority_display()})"

    def mark_processing(self) -> None:
        """Mark item as being processed."""
        self.status = self.STATUS_PROCESSING
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])

    def mark_completed(self) -> None:
        """Mark item as completed."""
        self.status = self.STATUS_COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])

    def mark_failed(self, error_message: str) -> None:
        """Mark item as failed."""
        self.status = self.STATUS_FAILED
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.retry_count += 1
        self.save(update_fields=['status', 'completed_at', 'error_message', 'retry_count'])

    def can_retry(self) -> bool:
        """Check if item can be retried."""
        return self.retry_count < self.max_retries and self.status == self.STATUS_FAILED

