"""
Tenant-specific permission classes for multi-tenant applications.

These permission classes ensure that users can only access resources
within their tenant context and have appropriate permissions for actions.
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class HasTenantAccess(permissions.BasePermission):
    """
    Permission class that ensures the user has access to the current tenant.
    This is the base permission for all tenant-scoped operations.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has access to the current tenant.
        
        Returns True if:
        - User is authenticated
        - User has active membership in the current tenant
        - Tenant context is properly set
        """
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must have tenant context
        if not hasattr(request, 'tenant') or not request.tenant:
            return False
        
        # Must have membership context
        if not hasattr(request, 'membership') or not request.membership:
            return False
        
        # Membership must be active
        if not request.membership.is_active:
            return False
        
        # Tenant must be active
        if not request.tenant.is_active:
            return False
        
        return True


class HasTenantRole(permissions.BasePermission):
    """
    Permission class that checks for specific roles within a tenant.
    """
    
    def __init__(self, required_roles=None):
        """
        Initialize with required roles.
        
        Args:
            required_roles: List of roles that are allowed, or None for any role
        """
        self.required_roles = required_roles or []
        super().__init__()
    
    def has_permission(self, request, view):
        """
        Check if user has one of the required roles in the current tenant.
        """
        # First check basic tenant access
        if not HasTenantAccess().has_permission(request, view):
            return False
        
        # If no specific roles required, any role is fine
        if not self.required_roles:
            return True
        
        # Check if user's role is in the required roles
        user_role = getattr(request.membership, 'role', None)
        return user_role in self.required_roles


class IsTenantAdmin(HasTenantRole):
    """
    Permission class that requires admin role in the current tenant.
    """
    
    def __init__(self):
        super().__init__(required_roles=['admin', 'super_admin'])


class IsTenantManager(HasTenantRole):
    """
    Permission class that requires manager or admin role in the current tenant.
    """
    
    def __init__(self):
        super().__init__(required_roles=['manager', 'admin', 'super_admin'])


class CanManageTenantMembers(permissions.BasePermission):
    """
    Permission class for managing tenant memberships.
    Only admins can add/remove members from tenants.
    """
    
    def has_permission(self, request, view):
        """
        Check if user can manage tenant members.
        """
        # Must have basic tenant access
        if not HasTenantAccess().has_permission(request, view):
            return False
        
        # Must be admin or super_admin
        user_role = getattr(request.membership, 'role', None)
        return user_role in ['admin', 'super_admin']


class CanViewTenantData(permissions.BasePermission):
    """
    Permission class for viewing tenant data.
    Most authenticated users with tenant access can view data.
    """
    
    def has_permission(self, request, view):
        """
        Check if user can view tenant data.
        """
        # Must have basic tenant access
        return HasTenantAccess().has_permission(request, view)


class CanCreateTenantData(permissions.BasePermission):
    """
    Permission class for creating tenant data.
    Requires at least staff role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user can create tenant data.
        """
        # Must have basic tenant access
        if not HasTenantAccess().has_permission(request, view):
            return False
        
        # Must have at least staff role
        user_role = getattr(request.membership, 'role', None)
        return user_role in ['staff', 'manager', 'admin', 'super_admin']


class CanUpdateTenantData(permissions.BasePermission):
    """
    Permission class for updating tenant data.
    Requires at least staff role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user can update tenant data.
        """
        # Must have basic tenant access
        if not HasTenantAccess().has_permission(request, view):
            return False
        
        # Must have at least staff role
        user_role = getattr(request.membership, 'role', None)
        return user_role in ['staff', 'manager', 'admin', 'super_admin']


class CanDeleteTenantData(permissions.BasePermission):
    """
    Permission class for deleting tenant data.
    Requires manager or admin role.
    """
    
    def has_permission(self, request, view):
        """
        Check if user can delete tenant data.
        """
        # Must have basic tenant access
        if not HasTenantAccess().has_permission(request, view):
            return False
        
        # Must have manager or admin role
        user_role = getattr(request.membership, 'role', None)
        return user_role in ['manager', 'admin', 'super_admin']


class TenantPermissionMixin:
    """
    Mixin that provides tenant-aware permission checking for ViewSets.
    """
    
    def get_permissions(self):
        """
        Return appropriate permissions based on action.
        Override this method in ViewSets to customize permissions.
        """
        if self.action == 'list':
            permission_classes = [CanViewTenantData]
        elif self.action == 'retrieve':
            permission_classes = [CanViewTenantData]
        elif self.action == 'create':
            permission_classes = [CanCreateTenantData]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [CanUpdateTenantData]
        elif self.action == 'destroy':
            permission_classes = [CanDeleteTenantData]
        else:
            permission_classes = [HasTenantAccess]
        
        return [permission() for permission in permission_classes]


class TenantAdminPermissionMixin:
    """
    Mixin that requires admin permissions for all actions.
    Use for sensitive tenant management operations.
    """
    
    def get_permissions(self):
        """
        Return admin permissions for all actions.
        """
        return [IsTenantAdmin()]


class TenantManagerPermissionMixin:
    """
    Mixin that requires manager permissions for all actions.
    Use for management-level operations.
    """
    
    def get_permissions(self):
        """
        Return manager permissions for all actions.
        """
        return [IsTenantManager()]


# Convenience permission classes for common use cases
class TenantReadOnly(permissions.BasePermission):
    """
    Permission class for read-only access to tenant data.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return CanViewTenantData().has_permission(request, view)
        return False


class TenantWriteAccess(permissions.BasePermission):
    """
    Permission class for write access to tenant data.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return CanViewTenantData().has_permission(request, view)
        else:
            return CanCreateTenantData().has_permission(request, view)


class TenantFullAccess(permissions.BasePermission):
    """
    Permission class for full access to tenant data.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return CanViewTenantData().has_permission(request, view)
        elif request.method == 'POST':
            return CanCreateTenantData().has_permission(request, view)
        elif request.method in ['PUT', 'PATCH']:
            return CanUpdateTenantData().has_permission(request, view)
        elif request.method == 'DELETE':
            return CanDeleteTenantData().has_permission(request, view)
        return False


# Utility functions for permission checking
def has_tenant_access(request):
    """
    Utility function to check if user has tenant access.
    
    Args:
        request: Django request object
        
    Returns:
        bool: True if user has tenant access, False otherwise
    """
    return HasTenantAccess().has_permission(request, None)


def has_tenant_role(request, required_roles):
    """
    Utility function to check if user has specific tenant role.
    
    Args:
        request: Django request object
        required_roles: List of required roles
        
    Returns:
        bool: True if user has one of the required roles, False otherwise
    """
    return HasTenantRole(required_roles).has_permission(request, None)


def get_user_tenant_role(request):
    """
    Utility function to get user's role in current tenant.
    
    Args:
        request: Django request object
        
    Returns:
        str: User's role in current tenant, or None if no access
    """
    if not has_tenant_access(request):
        return None
    
    return getattr(request.membership, 'role', None)


def require_tenant_access(request):
    """
    Utility function that raises PermissionDenied if user doesn't have tenant access.
    
    Args:
        request: Django request object
        
    Raises:
        PermissionDenied: If user doesn't have tenant access
    """
    if not has_tenant_access(request):
        raise PermissionDenied("Tenant access required")


def require_tenant_role(request, required_roles):
    """
    Utility function that raises PermissionDenied if user doesn't have required role.
    
    Args:
        request: Django request object
        required_roles: List of required roles
        
    Raises:
        PermissionDenied: If user doesn't have required role
    """
    if not has_tenant_role(request, required_roles):
        raise PermissionDenied(f"Required role: {', '.join(required_roles)}")
