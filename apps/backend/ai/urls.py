from django.urls import path
from .views import ForecastInventoryView, ForecastSalesView, ForecastProcurementView

urlpatterns = [
    path("forecast/inventory/", ForecastInventoryView.as_view()),
    path("forecast/sales/", ForecastSalesView.as_view()),
    path("forecast/procurement/", ForecastProcurementView.as_view()),
]
