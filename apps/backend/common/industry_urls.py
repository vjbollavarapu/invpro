"""
URL routing for industry-aware APIs
"""

from django.urls import path
from .industry_views import (
    IndustrySchemaView,
    IndustryBusinessRulesView,
    AvailableIndustriesView,
    IndustryModelDetailsView,
    TenantIndustryView
)

urlpatterns = [
    # Industry schema and configuration
    path('industry/schema/', IndustrySchemaView.as_view(), name='industry-schema'),
    path('industry/business-rules/', IndustryBusinessRulesView.as_view(), name='industry-business-rules'),
    path('industry/available/', AvailableIndustriesView.as_view(), name='available-industries'),
    path('industry/model-details/', IndustryModelDetailsView.as_view(), name='industry-model-details'),
    
    # Tenant industry management
    path('tenant/industry/', TenantIndustryView.as_view(), name='tenant-industry'),
]

