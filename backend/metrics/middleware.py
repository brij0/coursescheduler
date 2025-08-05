import time
import json
from metrics.tasks import log_api_metrics, estimate_user_year

# Import Prometheus metrics objects
from metrics.prometheus import request_count, request_duration

class HybridMetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        duration = time.perf_counter() - start

        # Prometheus metrics (lightweight)
        endpoint = getattr(request.resolver_match, 'view_name', 'unknown') if hasattr(request, 'resolver_match') else 'unknown'
        
        request_count.labels(
            method=request.method,
            endpoint=endpoint,
            status_code=response.status_code
        ).inc()
        
        request_duration.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)

        # Keep your existing Celery logging for detailed analysis
        if not request.path.startswith('/admin') and not request.path.startswith('/metrics'):
            try:
                session_id = request.session.session_key or str(request.session.session_key)
                log_api_metrics.delay({
                    "user_id": request.user.id if request.user.is_authenticated else None,
                    "session_id": session_id,
                    "path": request.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "duration": duration,
                    "api_name": endpoint,
                    "query_params": dict(request.GET),
                })
            except Exception as e:
                pass  # Don't break requests for metrics

        return response


class ApiYearEstimateMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store request body before it gets consumed
        if request.method == 'POST' and request.path == '/api/gpacalc/calculate/':
            try:
                # Read and store the body
                body = request.body
                if body:
                    data = json.loads(body.decode('utf-8'))
                    
                    # Prepare task data
                    task_data = {
                        "user_id": request.user.id if request.user.is_authenticated else None,
                        "session_id": request.session.session_key,
                        "courses": data.get("courses", [])
                    }
                    
                    estimate_user_year.delay(json.dumps(task_data))
                    
            except Exception as e:
                print(f"Error in ApiYearEstimateMiddleware: {e}")

        response = self.get_response(request)
        return response