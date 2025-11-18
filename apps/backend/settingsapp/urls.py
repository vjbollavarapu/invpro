from django.urls import path
from rest_framework import generics, permissions
from .models import SystemSetting, IntegrationSetting
from rest_framework.serializers import ModelSerializer

class SystemSettingSerializer(ModelSerializer):
    class Meta: model = SystemSetting; fields = "__all__"

class IntegrationSettingSerializer(ModelSerializer):
    class Meta: model = IntegrationSetting; fields = "__all__"

class SystemSettingList(generics.ListCreateAPIView):
    serializer_class = SystemSettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return SystemSetting.objects.filter(tenant=self.request.tenant)

class IntegrationSettingList(generics.ListCreateAPIView):
    serializer_class = IntegrationSettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return IntegrationSetting.objects.filter(tenant=self.request.tenant)

urlpatterns = [
    path("general/", SystemSettingList.as_view()),
    path("integrations/", IntegrationSettingList.as_view()),
]
