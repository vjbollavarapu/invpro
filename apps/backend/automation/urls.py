from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from .tasks import run_automation_rules

class RunRules(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        run_automation_rules.delay()
        return Response({"queued": True})

urlpatterns = [path("rules/", RunRules.as_view())]
