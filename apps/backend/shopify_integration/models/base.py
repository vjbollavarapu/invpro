"""Custom base classes for Shopify integration models."""

from django.db import models

from common.models import TenantAwareModel


class ShopifyBaseModel(TenantAwareModel):
    """Extends TenantAwareModel with Shopify-specific related_name conventions."""

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shopify_integration_%(class)s_created',
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shopify_integration_%(class)s_updated',
    )

    class Meta:
        abstract = True
