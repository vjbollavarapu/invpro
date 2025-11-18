from celery import shared_task
import requests, os
from django.conf import settings

@shared_task
def call_ai_service(tenant_id: int, payload: dict):
    url = settings.AI_SERVICE_URL + "/predict/"
    try:
        r = requests.post(url, json={"tenant_id":tenant_id, **payload}, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}
