"""
Common mixins for ViewSets and API views
"""

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied


class TenantScopedMixin:
    """
    Mixin to automatically scope querysets to the current tenant.
    Use with ViewSets to ensure multi-tenant data isolation.
    """
    
    def get_queryset(self):
        """Filter queryset to only include objects for the current tenant"""
        # Use manager-level filtering for automatic tenant isolation
        return self.queryset.model.objects.for_current_tenant(self.request)
    
    def perform_create(self, serializer):
        """Automatically set tenant_id and audit fields when creating objects"""
        if hasattr(self.request, 'tenant') and self.request.tenant:
            serializer.save(
                tenant_id=self.request.tenant.id,
                created_by=self.request.user
            )
        else:
            # No tenant context - this should not happen in normal flow
            raise PermissionDenied("Tenant context required for creation")
    
    def perform_update(self, serializer):
        """Automatically set updated_by when updating objects"""
        serializer.save(updated_by=self.request.user)

