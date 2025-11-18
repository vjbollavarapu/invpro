from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CostCenterViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'cost-centers', CostCenterViewSet, basename='costcenter')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
