import time
from metrics.tasks import log_api_metrics

class APIMetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        duration = time.perf_counter() - start

        if not request.path.startswith('/admin'):
            try:
                session_id = request.session.session_key or str(request.session.session_key)
                log_api_metrics.delay({
                    "user_id": request.user.id if request.user.is_authenticated else None,
                    "session_id": session_id,
                    "path": request.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "duration": duration,
                    "api_name": request.resolver_match.view_name if hasattr(request, 'resolver_match') and request.resolver_match else None,
                    "query_params": dict(request.GET), 
                    
                })
            except Exception as e:
                None

        return response
