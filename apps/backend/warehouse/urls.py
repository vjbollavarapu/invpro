from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, TransferViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'transfers', TransferViewSet, basename='transfer')

urlpatterns = [
    path('', include(router.urls)),
]
