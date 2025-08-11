from .models import  PrecomputedMetrics
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
@csrf_exempt
def get_latest_precomputed_metrics(request):
    """
    Fetch the most recent precomputed metrics from the database.
    """
    try:
        latest_metrics = PrecomputedMetrics.objects.filter(name='dashboard_metrics').order_by('-created_at').first()
        if not latest_metrics:
            return JsonResponse({'error': 'No metrics available'}, status=404)

        # Ensure the stored data is a dict; if not, wrap it
        metrics_data = latest_metrics.data
        if not isinstance(metrics_data, dict):
            metrics_data = {'value': metrics_data}

        payload = {
            'created_at': latest_metrics.created_at.isoformat(),
            'data': metrics_data
        }
        return JsonResponse(payload)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)