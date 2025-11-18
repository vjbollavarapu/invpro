from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Tenant, Membership
from .serializers import TenantSerializer, MembershipSerializer, MembershipCreateSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tenant management.
    Note: Not tenant-scoped since this manages tenants themselves.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'code']
    ordering = ['name']
    
    def get_queryset(self):
        """Return only tenants the user belongs to"""
        user = self.request.user
        if user.is_superuser:
            return Tenant.objects.all()
        
        # Get tenants user is a member of
        memberships = Membership.objects.filter(user=user, is_active=True)
        tenant_ids = memberships.values_list('tenant_id', flat=True)
        return Tenant.objects.filter(id__in=tenant_ids)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a tenant"""
        tenant = self.get_object()
        memberships = Membership.objects.filter(tenant=tenant).select_related('user')
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the tenant"""
        tenant = self.get_object()
        serializer = MembershipCreateSerializer(
            data=request.data,
            context={'tenant': tenant}
        )
        
        if serializer.is_valid():
            membership = serializer.save()
            return Response(
                MembershipSerializer(membership).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Membership management.
    """
    queryset = Membership.objects.select_related('user', 'tenant').all()
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['tenant', 'role', 'is_active']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter memberships by user's accessible tenants"""
        user = self.request.user
        if user.is_superuser:
            return Membership.objects.all()
        
        # Get user's tenant memberships
        user_tenant_ids = Membership.objects.filter(
            user=user, 
            is_active=True
        ).values_list('tenant_id', flat=True)
        
        return Membership.objects.filter(tenant_id__in=user_tenant_ids)
