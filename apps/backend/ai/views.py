from rest_framework import views, permissions, response
from .tasks import call_ai_service

class ForecastInventoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        payload = {"type":"inventory", "data": request.data.get("data", [])}
        task = call_ai_service.delay(request.tenant.id, payload)
        return response.Response({"task_id": task.id})

class ForecastSalesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        payload = {"type":"sales", "data": request.data.get("data", [])}
        task = call_ai_service.delay(request.tenant.id, payload)
        return response.Response({"task_id": task.id})

class ForecastProcurementView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        payload = {"type":"procurement", "data": request.data.get("data", [])}
        task = call_ai_service.delay(request.tenant.id, payload)
        return response.Response({"task_id": task.id})
