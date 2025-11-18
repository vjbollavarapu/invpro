"""Enhanced Shopify API client with rate limiting, retry logic, and pagination."""

from __future__ import annotations

import logging
import time
from typing import Any, Iterable
from urllib.parse import urljoin

import requests

from ..config import (
    SHOPIFY_MAX_REQUESTS_PER_SECOND,
    SHOPIFY_MAX_RETRY_ATTEMPTS,
    SHOPIFY_RETRY_DELAY,
)
from ..utils.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)


class ShopifyApiError(Exception):
    """Raised when the Shopify API returns an error response."""


class ShopifyApiClient:
    """Enhanced wrapper around the Shopify REST API with rate limiting and retry logic."""

    def __init__(self, integration, *, session: requests.Session | None = None) -> None:
        self.integration = integration
        self.session = session or requests.Session()
        self.rate_limiter = RateLimiter(namespace=f"shopify_{integration.id}")

    def fetch_products(self, *, updated_after=None, limit: int = 250) -> Iterable[dict[str, Any]]:
        """Fetch products with pagination support."""
        return self._paginate_collection(
            "products.json",
            params=self._build_time_query(updated_after, limit=limit),
            key="products",
        )

    def fetch_orders(self, *, updated_after=None, status: str = "any", limit: int = 250) -> Iterable[dict[str, Any]]:
        """Fetch orders with pagination support."""
        params = self._build_time_query(updated_after, limit=limit)
        params["status"] = status
        params["order"] = "updated_at asc"
        return self._paginate_collection("orders.json", params=params, key="orders")

    def fetch_customers(self, *, updated_after=None, limit: int = 250) -> Iterable[dict[str, Any]]:
        """Fetch customers with pagination support."""
        return self._paginate_collection(
            "customers.json",
            params=self._build_time_query(updated_after, limit=limit),
            key="customers",
        )

    def fetch_inventory_levels(self, *, updated_after=None, limit: int = 250) -> Iterable[dict[str, Any]]:
        """Fetch inventory levels with pagination support."""
        return self._paginate_collection(
            "inventory_levels.json",
            params=self._build_time_query(updated_after, limit=limit),
            key="inventory_levels",
        )

    def test_connection(self) -> dict[str, Any]:
        """Test the Shopify connection by fetching shop information."""
        try:
            response = self._request("GET", "shop.json", retry=False)
            return {
                "success": True,
                "shop": response.get("shop", {}),
                "message": "Connection successful",
            }
        except ShopifyApiError as exc:
            return {
                "success": False,
                "message": str(exc),
                "error": "Connection failed",
            }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _paginate_collection(
        self, endpoint: str, *, params: dict[str, Any], key: str
    ) -> Iterable[dict[str, Any]]:
        """Fetch collection with cursor-based pagination."""
        page_info = None
        page_count = 0
        max_pages = 1000  # Safety limit

        while page_count < max_pages:
            page_params = params.copy()
            if page_info:
                page_params["page_info"] = page_info
                page_params.pop("limit", None)  # Remove limit when using page_info

            try:
                payload = self._request("GET", endpoint, params=page_params)
                items = payload.get(key, []) if isinstance(payload, dict) else []

                if not items:
                    break

                for item in items:
                    yield item

                # Check for next page
                link_header = payload.get("link") or ""
                page_info = self._extract_next_page_info(link_header)
                if not page_info:
                    break

                page_count += 1
            except ShopifyApiError as exc:
                logger.error("Error fetching page %s: %s", page_count, exc)
                break

    def _extract_next_page_info(self, link_header: str) -> str | None:
        """Extract next page_info from Shopify link header."""
        if not link_header:
            return None

        # Shopify link format: <https://...?page_info=XXX>; rel="next"
        for segment in link_header.split(","):
            if 'rel="next"' in segment or "rel='next'" in segment:
                if "page_info=" in segment:
                    # Extract page_info value
                    start = segment.find("page_info=") + len("page_info=")
                    end = segment.find(">", start)
                    if end == -1:
                        end = segment.find("&", start)
                        if end == -1:
                            end = len(segment)
                    return segment[start:end].strip('"\'')
        return None

    def _request(
        self, method: str, endpoint: str, *, params=None, json=None, retry: bool = True
    ) -> dict[str, Any]:
        """Make API request with rate limiting and retry logic."""
        if not self.integration.access_token:
            logger.info(
                "Skipping Shopify API request for %s because access token is missing",
                self.integration.store_url,
            )
            return {}

        # Rate limiting
        rate_key = f"{self.integration.id}_{endpoint}"
        if not self.rate_limiter.allow(
            rate_key, limit=SHOPIFY_MAX_REQUESTS_PER_SECOND, period=1
        ):
            logger.warning("Rate limit exceeded for %s", endpoint)
            time.sleep(0.1)  # Brief pause before retry

        url = self._build_url(endpoint)
        headers = {
            "X-Shopify-Access-Token": self.integration.access_token,
            "Content-Type": "application/json",
        }

        # Retry logic with exponential backoff
        last_exception = None
        for attempt in range(SHOPIFY_MAX_RETRY_ATTEMPTS if retry else 1):
            try:
                response = self.session.request(method, url, params=params, json=json, timeout=30)
                
                if response.status_code >= 400:
                    # Don't retry on 4xx errors (client errors)
                    if 400 <= response.status_code < 500:
                        logger.error("Shopify API client error %s: %s", response.status_code, response.text)
                        raise ShopifyApiError(response.text)
                    
                    # Retry on 5xx errors (server errors)
                    if attempt < SHOPIFY_MAX_RETRY_ATTEMPTS - 1:
                        wait_time = SHOPIFY_RETRY_DELAY * (2 ** attempt)  # Exponential backoff
                        logger.warning(
                            "Shopify API server error %s, retrying in %s seconds (attempt %s/%s)",
                            response.status_code,
                            wait_time,
                            attempt + 1,
                            SHOPIFY_MAX_RETRY_ATTEMPTS,
                        )
                        time.sleep(wait_time)
                        continue
                    
                    logger.error("Shopify API error %s: %s", response.status_code, response.text)
                    raise ShopifyApiError(response.text)

                return response.json()

            except requests.RequestException as exc:
                last_exception = exc
                if attempt < SHOPIFY_MAX_RETRY_ATTEMPTS - 1 and retry:
                    wait_time = SHOPIFY_RETRY_DELAY * (2 ** attempt)
                    logger.warning(
                        "Shopify API request failed, retrying in %s seconds (attempt %s/%s): %s",
                        wait_time,
                        attempt + 1,
                        SHOPIFY_MAX_RETRY_ATTEMPTS,
                        exc,
                    )
                    time.sleep(wait_time)
                else:
                    logger.error("Shopify API request failed after %s attempts: %s", attempt + 1, exc)
                    raise ShopifyApiError(str(exc)) from exc

        if last_exception:
            raise ShopifyApiError(str(last_exception)) from last_exception

        return {}

    def _build_url(self, endpoint: str) -> str:
        """Build Shopify API URL."""
        base_url = self.integration.store_url
        if not base_url.startswith("http"):
            base_url = f"https://{base_url.strip('/')}"
        api_root = f"/admin/api/{self.integration.api_version}/"
        return urljoin(base_url + "/", api_root + endpoint)

    @staticmethod
    def _build_time_query(updated_after, *, limit: int) -> dict[str, Any]:
        """Build time-based query parameters."""
        params: dict[str, Any] = {"limit": limit}
        if updated_after:
            params["updated_at_min"] = updated_after.isoformat()
        return params
