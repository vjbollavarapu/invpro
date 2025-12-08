"""API endpoint for verifying and managing integration credentials."""

from __future__ import annotations

import logging
import uuid
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration

logger = logging.getLogger(__name__)


class CredentialsView(APIView):
    """API endpoint for verifying credentials are stored correctly."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Verify credentials are stored (without exposing them)."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {
                    "has_integration": False,
                    "message": "No Shopify integration found",
                },
                status=status.HTTP_200_OK,
            )

        # Check if credentials are present (without exposing them)
        has_api_key = bool(integration.api_key)
        has_api_secret = bool(integration.api_secret)
        has_access_token = bool(integration.access_token)
        
        # Get lengths for verification (not the actual values)
        api_key_length = len(integration.api_key) if integration.api_key else 0
        api_secret_length = len(integration.api_secret) if integration.api_secret else 0
        access_token_length = len(integration.access_token) if integration.access_token else 0

        # Verify credentials are not empty strings
        credentials_present = (
            has_api_key and
            has_api_secret and
            has_access_token and
            api_key_length > 0 and
            api_secret_length > 0 and
            access_token_length > 0
        )

        return Response(
            {
                "has_integration": True,
                "store_url": integration.store_url,
                "status": integration.status,
                "is_connected": integration.is_connected,
                "credentials": {
                    "api_key": {
                        "present": has_api_key,
                        "length": api_key_length,
                        "preview": f"{integration.api_key[:4]}..." if has_api_key and api_key_length > 4 else None,
                    },
                    "api_secret": {
                        "present": has_api_secret,
                        "length": api_secret_length,
                        "preview": f"{integration.api_secret[:4]}..." if has_api_secret and api_secret_length > 4 else None,
                    },
                    "access_token": {
                        "present": has_access_token,
                        "length": access_token_length,
                        "preview": f"{integration.access_token[:4]}..." if has_access_token and access_token_length > 4 else None,
                    },
                },
                "all_credentials_present": credentials_present,
                "message": "Credentials are stored" if credentials_present else "Some credentials are missing",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        """Test if stored credentials are valid by making a test API call."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()

        if not integration:
            return Response(
                {"error": "Shopify integration not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if credentials are present
        if not integration.api_key or not integration.api_secret or not integration.access_token:
            return Response(
                {
                    "error": "Credentials are missing",
                    "details": {
                        "has_api_key": bool(integration.api_key),
                        "has_api_secret": bool(integration.api_secret),
                        "has_access_token": bool(integration.access_token),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Test connection using stored credentials
        try:
            from ..services import ShopifyApiClient

            client = ShopifyApiClient(integration)
            test_result = client.test_connection()

            if test_result.get("success"):
                return Response(
                    {
                        "success": True,
                        "message": "Credentials are valid and working",
                        "test_result": {
                            "shop_name": test_result.get("shop", {}).get("name"),
                            "shop_domain": test_result.get("shop", {}).get("domain"),
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "success": False,
                        "message": "Credentials are stored but connection test failed",
                        "error": test_result.get("message"),
                        "test_result": test_result,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            logger.exception("Error testing credentials")
            return Response(
                {
                    "success": False,
                    "error": f"Failed to test credentials: {str(e)}",
                },
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

        raise PermissionError("Tenant context required for credentials verification.")

