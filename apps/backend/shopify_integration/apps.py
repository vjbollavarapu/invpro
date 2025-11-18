"""App configuration for the Shopify integration module."""

from django.apps import AppConfig


class ShopifyIntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shopify_integration'
    verbose_name = 'Shopify Integration'

    def ready(self) -> None:  # pragma: no cover - import side effects only
        """Perform runtime registrations when the app is ready."""

        # Lazy import to avoid import cycles when Django loads apps
        try:
            from . import signals  # noqa: F401  # pylint: disable=unused-import
        except ModuleNotFoundError:
            # Signals are optional for this app; ignore if module is absent
            return
