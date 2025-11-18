"""Helpers for validating Shopify webhook signatures."""

from __future__ import annotations

import base64
import hmac
import hashlib


def validate_shopify_hmac(signature: str, body: bytes, secret: str) -> bool:
    """Verify Shopify webhook signatures using the shared secret."""

    if not signature or not secret:
        return False

    digest = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).digest()
    computed = base64.b64encode(digest).decode('utf-8')
    # Shopify signatures are case sensitive but include padding; compare in constant time
    return hmac.compare_digest(computed, signature)
