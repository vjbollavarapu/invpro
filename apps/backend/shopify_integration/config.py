"""Configuration for Shopify integration using environment variables."""

import os
from typing import Optional


def get_shopify_config(key: str, default: Optional[str] = None) -> str:
    """Get Shopify configuration value from environment."""
    return os.getenv(f"SHOPIFY_{key}", default or "")


# API Configuration
SHOPIFY_API_VERSION = get_shopify_config("API_VERSION", "2024-10")
SHOPIFY_WEBHOOK_BASE_URL = get_shopify_config("WEBHOOK_BASE_URL", "http://localhost:8000")

# Rate Limiting
SHOPIFY_MAX_REQUESTS_PER_SECOND = int(get_shopify_config("MAX_REQUESTS_PER_SECOND", "40"))

# Sync Intervals (in seconds)
SHOPIFY_SYNC_INTERVAL_PRODUCTS = int(get_shopify_config("SYNC_INTERVAL_PRODUCTS", "3600"))
SHOPIFY_SYNC_INTERVAL_ORDERS = int(get_shopify_config("SYNC_INTERVAL_ORDERS", "1800"))
SHOPIFY_SYNC_INTERVAL_CUSTOMERS = int(get_shopify_config("SYNC_INTERVAL_CUSTOMERS", "7200"))
SHOPIFY_SYNC_INTERVAL_INVENTORY = int(get_shopify_config("SYNC_INTERVAL_INVENTORY", "900"))

# Retry Configuration
SHOPIFY_MAX_RETRY_ATTEMPTS = int(get_shopify_config("MAX_RETRY_ATTEMPTS", "3"))
SHOPIFY_RETRY_DELAY = int(get_shopify_config("RETRY_DELAY", "5"))

# Logging
SHOPIFY_DEBUG_LOGGING = get_shopify_config("DEBUG_LOGGING", "False").lower() == "true"
SHOPIFY_LOG_LEVEL = get_shopify_config("LOG_LEVEL", "INFO")

