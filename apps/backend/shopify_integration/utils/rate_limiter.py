"""Simple cache-based rate limiting helpers."""

from __future__ import annotations

from django.core.cache import cache


class RateLimiter:
    """Basic fixed-window rate limiter using Django's cache backend."""

    def __init__(self, namespace: str = 'shopify') -> None:
        self.namespace = namespace

    def allow(self, key: str, *, limit: int, period: int) -> bool:
        cache_key = self._cache_key(key)
        current = cache.get(cache_key)
        if current is None:
            cache.add(cache_key, 1, timeout=period)
            return True
        if current >= limit:
            return False
        cache.incr(cache_key)
        return True

    def _cache_key(self, key: str) -> str:
        return f"{self.namespace}:{key}"
