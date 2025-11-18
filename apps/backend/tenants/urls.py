from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, MembershipViewSet

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'memberships', MembershipViewSet, basename='membership')

urlpatterns = [
    path('', include(router.urls)),
]

