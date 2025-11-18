from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardViewSet, MultiTenantManagementViewSet

router = DefaultRouter()
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'multi-tenant', MultiTenantManagementViewSet, basename='multi-tenant')

urlpatterns = [
    path('', include(router.urls)),
]
