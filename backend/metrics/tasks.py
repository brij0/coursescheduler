from celery import shared_task
from metrics.models import ApiTimingLog

@shared_task(bind=True, serializer='json')
def log_api_metrics(self, data):
    try:
        ApiTimingLog.objects.create(
            user_id=data.get("user_id"),
            session_id=data.get("session_id"),
            path=data.get("path"),
            method=data.get("method"),
            api_name=data.get("api_name"),
            duration=data.get("duration"),
            status_code=data.get("status_code"),
            extra={
                "query_params": data.get("query_params", {}),
                # Remove body or add size limits
            }
        )
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)

@shared_task
def test_hello():
    print("Hello from Celery!")
    return "OK"
