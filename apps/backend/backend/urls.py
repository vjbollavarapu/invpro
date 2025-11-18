"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Authentication & Users
    path('api/', include('users.urls')),
    
    # Core Business APIs
    path('api/inventory/', include('inventory.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/procurement/', include('procurement.urls')),
    path('api/warehouse/', include('warehouse.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/pharma/', include('pharma.urls')),  # Pharmaceutical inventory
    path('api/shopify/', include('shopify_integration.urls')),
    path('api/integrations/', include('integrations.urls')),  # Integrations (Stripe, Email, etc.)
    
    # Supporting APIs
    path('api/', include('tenants.urls')),
    path('api/', include('notifications.urls')),
    path('api/settings/', include('settingsapp.urls')),
    
    # Industry Management
    path('api/', include('common.industry_urls')),
    
    # Dashboard & Multi-Tenant Management
    path('api/', include('api.urls')),
]
