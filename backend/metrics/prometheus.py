from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse
import time

# Global metrics (created once at startup)
request_count = Counter(
    'django_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

request_duration = Histogram(
    'django_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

def metrics_view(request):
    """Endpoint for Prometheus to scrape metrics"""
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)