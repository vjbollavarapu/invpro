from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DrugProductViewSet, PackagingLevelViewSet,
    DrugBatchViewSet, DrugDispensingViewSet,
    DrugInventoryViewSet
)

router = DefaultRouter()
router.register(r'products', DrugProductViewSet, basename='drug-product')
router.register(r'packaging-levels', PackagingLevelViewSet, basename='packaging-level')
router.register(r'batches', DrugBatchViewSet, basename='drug-batch')
router.register(r'dispensing', DrugDispensingViewSet, basename='drug-dispensing')
router.register(r'inventory', DrugInventoryViewSet, basename='drug-inventory')

urlpatterns = [
    path('', include(router.urls)),
]

