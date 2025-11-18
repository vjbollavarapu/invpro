"""Webhook endpoint for Shopify to push updates."""

from __future__ import annotations

import logging

from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration
from ..services import ShopifyWebhookService

logger = logging.getLogger(__name__)


class ShopifyWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []  # Webhooks are authenticated via HMAC signature

    def post(self, request, *args, **kwargs):
        topic = request.headers.get('X-Shopify-Topic')
        store_domain = request.headers.get('X-Shopify-Shop-Domain')
        signature = request.headers.get('X-Shopify-Hmac-Sha256')

        if not store_domain:
            logger.warning("Missing Shopify store domain header")
            return Response({'detail': 'Missing store domain'}, status=status.HTTP_400_BAD_REQUEST)

        integration = self._resolve_integration(store_domain)
        if not integration:
            logger.warning("No Shopify integration configured for domain %s", store_domain)
            return Response({'detail': 'Integration not found'}, status=status.HTTP_404_NOT_FOUND)

        service = ShopifyWebhookService(integration)
        if not signature or not service.verify(signature=signature, body=request.body):
            logger.warning("Invalid Shopify webhook signature for %s", store_domain)
            return Response({'detail': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        service.dispatch(topic=topic, payload=request.data)
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _resolve_integration(store_domain: str):
        return ShopifyIntegration.objects.filter(store_url__icontains=store_domain).first()
