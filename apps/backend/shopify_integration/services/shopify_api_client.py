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
        # Use integration ID if available, otherwise use a temporary identifier
        integration_id = getattr(integration, 'id', None) or f"temp_{id(integration)}"
        self.rate_limiter = RateLimiter(namespace=f"shopify_{integration_id}")

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

    # ------------------------------------------------------------------
    # Write operations (Push to Shopify)
    # ------------------------------------------------------------------

    def create_product(self, product_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new product in Shopify."""
        logger.info("Creating product in Shopify: %s", product_data.get('title', 'Unknown'))
        response = self._request("POST", "products.json", json={"product": product_data})
        return response.get("product", {})

    def update_product(self, product_id: str, product_data: dict[str, Any]) -> dict[str, Any]:
        """Update an existing product in Shopify."""
        logger.info("Updating product %s in Shopify", product_id)
        response = self._request("PUT", f"products/{product_id}.json", json={"product": product_data})
        return response.get("product", {})

    def update_inventory_level(
        self, location_id: str, inventory_item_id: str, quantity: int
    ) -> dict[str, Any]:
        """Update inventory level in Shopify."""
        logger.info(
            "Updating inventory level: location_id=%s, inventory_item_id=%s, quantity=%d",
            location_id,
            inventory_item_id,
            quantity,
        )
        data = {
            "location_id": location_id,
            "inventory_item_id": inventory_item_id,
            "available": quantity,
        }
        response = self._request("POST", "inventory_levels/set.json", json=data)
        return response.get("inventory_level", {})

    def create_order(self, order_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new order in Shopify."""
        logger.info("Creating order in Shopify")
        response = self._request("POST", "orders.json", json={"order": order_data})
        return response.get("order", {})

    def update_order(self, order_id: str, order_data: dict[str, Any]) -> dict[str, Any]:
        """Update an existing order in Shopify."""
        logger.info("Updating order %s in Shopify", order_id)
        response = self._request("PUT", f"orders/{order_id}.json", json={"order": order_data})
        return response.get("order", {})

    def test_connection(self) -> dict[str, Any]:
        """Test the Shopify connection by fetching shop information."""
        try:
            # Log connection test details for debugging - use print for visibility
            print(f"[SHOPIFY DEBUG] Testing connection:")
            print(f"  store_url: {self.integration.store_url}")
            print(f"  has_token: {bool(self.integration.access_token)}")
            print(f"  token_length: {len(self.integration.access_token) if self.integration.access_token else 0}")
            print(f"  token_preview: {self.integration.access_token[:20] if self.integration.access_token else 'None'}...")
            print(f"  api_version: {self.integration.api_version}")
            
            logger.info(
                "Testing Shopify connection: store_url=%s, has_token=%s, api_version=%s",
                self.integration.store_url,
                bool(self.integration.access_token),
                self.integration.api_version,
            )
            response = self._request("GET", "shop.json", retry=False)
            shop_data = response.get("shop", {})
            return {
                "success": True,
                "shop": shop_data,
                "message": f"Connection successful - Connected to {shop_data.get('name', 'Shopify store')}",
            }
        except ShopifyApiError as exc:
            error_str = str(exc)
            # Parse error message for better user feedback
            if "401" in error_str or "Unauthorized" in error_str:
                message = "Invalid access token. Please verify your access token is correct and has not expired."
            elif "403" in error_str or "Forbidden" in error_str:
                message = "Access denied. Please check that your app has the required API permissions (scopes)."
            elif "404" in error_str or "Not Found" in error_str:
                message = f"Store not found. Please verify the store URL: {self.integration.store_url}"
            elif "429" in error_str or "rate limit" in error_str.lower():
                message = "Rate limit exceeded. Please wait a moment and try again."
            else:
                message = f"Connection failed: {error_str}"
            
            return {
                "success": False,
                "message": message,
                "error": "Connection failed",
                "raw_error": error_str,
            }
        except Exception as exc:
            return {
                "success": False,
                "message": f"Unexpected error: {str(exc)}",
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
        
        # Ensure access token is clean (no extra spaces)
        access_token = self.integration.access_token.strip() if self.integration.access_token else ""
        
        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }
        
        # Log request details for debugging - use print for visibility
        token_preview = access_token[:20] + "..." if access_token else "None"
        token_length = len(access_token) if access_token else 0
        print(f"[SHOPIFY DEBUG] Making request:")
        print(f"  method: {method}")
        print(f"  endpoint: {endpoint}")
        print(f"  url: {url}")
        print(f"  token_length: {token_length}")
        print(f"  token_preview: {token_preview}")
        print(f"  store_url: {self.integration.store_url}")
        print(f"  api_version: {self.integration.api_version}")
        
        logger.info(
            "Shopify API request: method=%s, endpoint=%s, url=%s, token_length=%d, token_preview=%s, store_url=%s, api_version=%s",
            method,
            endpoint,
            url,
            token_length,
            token_preview,
            self.integration.store_url,
            self.integration.api_version,
        )

        # Retry logic with exponential backoff
        last_exception = None
        for attempt in range(SHOPIFY_MAX_RETRY_ATTEMPTS if retry else 1):
            try:
                # Debug: Print the exact headers being sent
                print(f"[SHOPIFY DEBUG] Request details:")
                print(f"  URL: {url}")
                print(f"  Method: {method}")
                print(f"  Token (full): '{access_token}'")
                print(f"  Token length: {len(access_token)}")
                print(f"  Token starts with: {access_token[:6] if access_token else 'None'}")
                print(f"  Token ends with: {access_token[-10:] if len(access_token) > 10 else access_token}")
                print(f"  Headers being sent: {list(headers.keys())}")
                print(f"  Header X-Shopify-Access-Token value: '{headers.get('X-Shopify-Access-Token', 'MISSING')}'")
                print(f"  Header X-Shopify-Access-Token length: {len(headers.get('X-Shopify-Access-Token', ''))}")
                
                # Test with direct requests to compare
                import requests as req_lib
                test_response = req_lib.get(
                    url,
                    headers={
                        "X-Shopify-Access-Token": access_token,
                        "Content-Type": "application/json",
                    },
                    timeout=30
                )
                print(f"[SHOPIFY DEBUG] Direct requests test:")
                print(f"  status_code: {test_response.status_code}")
                print(f"  response_text: {test_response.text[:200]}")
                
                response = self.session.request(method, url, params=params, json=json, timeout=30, headers=headers)
                
                print(f"[SHOPIFY DEBUG] Session request response:")
                print(f"  status_code: {response.status_code}")
                print(f"  response_text: {response.text[:200]}")
                
                if response.status_code >= 400:
                    # Don't retry on 4xx errors (client errors)
                    if 400 <= response.status_code < 500:
                        error_text = response.text
                        # Log full error details for debugging
                        logger.error(
                            "Shopify API client error %s: %s",
                            response.status_code,
                            error_text,
                            extra={
                                'url': url,
                                'method': method,
                                'endpoint': endpoint,
                                'store_url': self.integration.store_url,
                                'api_version': self.integration.api_version,
                                'token_length': len(self.integration.access_token) if self.integration.access_token else 0,
                                'token_starts_with': self.integration.access_token[:10] if self.integration.access_token else None,
                                'headers_sent': {k: v[:20] + '...' if len(v) > 20 else v for k, v in headers.items() if k != 'X-Shopify-Access-Token'},
                            }
                        )
                        # Include status code in error message for better debugging
                        raise ShopifyApiError(f"[{response.status_code}] {error_text}")
                    
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
        # Remove protocol if present, then add https://
        if base_url.startswith(('http://', 'https://')):
            base_url = base_url.split('://', 1)[1]
        base_url = base_url.strip('/')
        base_url = f"https://{base_url}"
        api_root = f"/admin/api/{self.integration.api_version}/"
        full_url = urljoin(base_url + "/", api_root + endpoint)
        
        # Use print for visibility
        print(f"[SHOPIFY DEBUG] Building URL:")
        print(f"  original store_url: {self.integration.store_url}")
        print(f"  cleaned base_url: {base_url}")
        print(f"  api_version: {self.integration.api_version}")
        print(f"  endpoint: {endpoint}")
        print(f"  final URL: {full_url}")
        
        logger.info(
            "Built Shopify URL: %s (from store_url=%s, api_version=%s, endpoint=%s)",
            full_url,
            self.integration.store_url,
            self.integration.api_version,
            endpoint
        )
        return full_url

    @staticmethod
    def _build_time_query(updated_after, *, limit: int) -> dict[str, Any]:
        """Build time-based query parameters."""
        params: dict[str, Any] = {"limit": limit}
        if updated_after:
            params["updated_at_min"] = updated_after.isoformat()
        return params
