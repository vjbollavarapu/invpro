from django.utils.deprecation import MiddlewareMixin
from tenants.models import Tenant, Membership
import logging

logger = logging.getLogger('tenancy.audit')


class TenantMiddleware(MiddlewareMixin):
    """
    Extracts tenant from request headers and validates user has access.
    Sets request.tenant for use in views and querysets.
    """
    
    def process_request(self, request):
        # Initialize tenant to None
        request.tenant = None
        
        # Get tenant ID from header
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            return
        
        # For authenticated users, verify they have access to this tenant
        if request.user and request.user.is_authenticated:
            try:
                # Handle both tenant ID (integer) and tenant code (string)
                if tenant_id.isdigit():
                    # tenant_id is a numeric ID
                    membership = Membership.objects.select_related('tenant').get(
                        user=request.user,
                        tenant_id=int(tenant_id),
                        tenant__is_active=True,
                        is_active=True
                    )
                else:
                    # tenant_id is a tenant code
                    membership = Membership.objects.select_related('tenant').get(
                        user=request.user,
                        tenant__code=tenant_id,
                        tenant__is_active=True,
                        is_active=True
                    )
                request.tenant = membership.tenant
                request.membership = membership  # Add membership context for permissions
                
                # Audit log tenant context establishment
                logger.info(
                    f"Tenant context established: "
                    f"user={request.user.id} "
                    f"tenant={membership.tenant.id} "
                    f"role={membership.role} "
                    f"path={request.path}"
                )
            except Membership.DoesNotExist:
                # User doesn't have access to this tenant
                request.tenant = None
                request.membership = None
                
                # Audit log access denied
                logger.warning(
                    f"Tenant access denied: "
                    f"user={request.user.id} "
                    f"requested_tenant={tenant_id} "
                    f"path={request.path}"
                )
        else:
            # For unauthenticated requests (e.g., login), just verify tenant exists
            try:
                if tenant_id.isdigit():
                    # tenant_id is a numeric ID
                    request.tenant = Tenant.objects.get(id=int(tenant_id), is_active=True)
                else:
                    # tenant_id is a tenant code
                    request.tenant = Tenant.objects.get(code=tenant_id, is_active=True)
                request.membership = None  # No membership for unauthenticated users
            except Tenant.DoesNotExist:
                request.tenant = None
                request.membership = None
