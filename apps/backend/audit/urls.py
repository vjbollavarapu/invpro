from django.urls import path
from rest_framework import generics, permissions
from .models import AuditLog
from rest_framework.serializers import ModelSerializer

class AuditLogSerializer(ModelSerializer):
    class Meta: model = AuditLog; fields = "__all__"

class ListAudit(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return AuditLog.objects.filter(tenant=self.request.tenant).order_by("-timestamp")

urlpatterns = [path("", ListAudit.as_view())]
