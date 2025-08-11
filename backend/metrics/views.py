from .models import ApiTimingLog, EstimateUserYear, PrecomputedMetrics
from django.db import models
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.http import JsonResponse
from .models import ApiTimingLog, EstimateUserYear
from django.db.models import Avg, Count, F, ExpressionWrapper, fields
from django.utils import timezone
import datetime
import re
from django.db.models.functions import TruncHour
from django.contrib.auth.models import User

def normalize_endpoint(path):
    """
    Normalize API endpoints by replacing IDs with placeholders
    """
    # Replace numeric IDs with :id placeholder
    path = re.sub(r'/\d+/', '/:id/', path)
    path = re.sub(r'/\d+$', '/:id', path)
    
    # Group common endpoints
    if '/coopforum/posts' in path:
        if '/comments' in path:
            return '/api/coopforum/posts/:id/comments'
        elif '/vote' in path:
            return '/api/coopforum/posts/:id/vote'
        else:
            return '/api/coopforum/posts'
    elif '/coopforum/comments' in path:
        if '/vote' in path:
            return '/api/coopforum/comments/:id/vote'
        else:
            return '/api/coopforum/comments'
    
    return path

@csrf_exempt
def error_rates_by_endpoint(request):
    """
    Tracks error rates (4xx, 5xx) specifically for each API endpoint.
    Groups similar endpoints together.
    """
    # Get all logs with normalized paths
    logs = ApiTimingLog.objects.all()
    
    # Group by normalized path
    grouped_data = {}
    for log in logs:
        normalized_path = normalize_endpoint(log.path)
        if normalized_path not in grouped_data:
            grouped_data[normalized_path] = {'total': 0, 'errors': 0}
        
        grouped_data[normalized_path]['total'] += 1
        if log.status_code >= 400:
            grouped_data[normalized_path]['errors'] += 1
    
    # Calculate error rates
    error_rates = []
    for path, data in grouped_data.items():
        error_rate = (data['errors'] * 100.0 / data['total']) if data['total'] > 0 else 0
        error_rates.append({
            'path': path,
            'total_requests': data['total'],
            'error_count': data['errors'],
            'error_rate': error_rate
        })
    
    # Sort by error rate descending
    error_rates.sort(key=lambda x: x['error_rate'], reverse=True)
    
    return JsonResponse(error_rates, safe=False)

@csrf_exempt
def p95_p99_latency(request):
    """
    Tracks the 95th and 99th percentile latency for key API endpoints.
    """
    # Get all API timings, order by duration
    all_timings = ApiTimingLog.objects.all().order_by('duration')
    total_count = all_timings.count()

    if total_count == 0:
        return JsonResponse({"error": "No API timings available"}, status=400)

    # Calculate index for 95th and 99th percentile
    p95_index = int(total_count * 0.95)
    p99_index = int(total_count * 0.99)

    # Get the values at those indexes (approximate)
    p95_latency = all_timings[p95_index].duration if p95_index < total_count else None
    p99_latency = all_timings[p99_index].duration if p99_index < total_count else None

    return JsonResponse({"p95_latency": p95_latency, "p99_latency": p99_latency})

@csrf_exempt
def request_volume_over_time(request):
    """
    Visualizes the number of requests per minute/hour/day.
    """
    try:
        # First check if we have any data
        if not ApiTimingLog.objects.exists():
            return JsonResponse([], safe=False)
            
        # Get last 24 hours of data
        last_24_hours = timezone.now() - datetime.timedelta(hours=24)
        
        # Aggregate requests per hour with proper error handling
        hourly_volume = ApiTimingLog.objects.filter(
            timestamp__gte=last_24_hours
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            request_count=Count('id')
        ).order_by('hour')
        
        # Convert to list and handle datetime serialization
        result = []
        for item in hourly_volume:
            result.append({
                'hour': item['hour'].isoformat() if item['hour'] else None,
                'request_count': item['request_count']
            })
            
        return JsonResponse(result, safe=False)
        
    except Exception as e:
        print(f"Error aggregating request volume: {e}")
        # Return empty array instead of error to prevent dashboard crash
        return JsonResponse([], safe=False)

@csrf_exempt
def api_usage_patterns(request):
    """
    Which APIs are used most frequently? Groups similar endpoints.
    """
    logs = ApiTimingLog.objects.all()
    
    # Group by normalized path
    grouped_data = {}
    for log in logs:
        normalized_path = normalize_endpoint(log.path)
        if normalized_path not in grouped_data:
            grouped_data[normalized_path] = 0
        grouped_data[normalized_path] += 1
    
    # Convert to list format
    usage_patterns = []
    for path, count in grouped_data.items():
        usage_patterns.append({
            'api_name': path,
            'request_count': count
        })
    
    # Sort by request count descending
    usage_patterns.sort(key=lambda x: x['request_count'], reverse=True)
    
    return JsonResponse(usage_patterns, safe=False)

@csrf_exempt
def average_time_per_endpoint(request):
    """
    Average time for each request types with grouped endpoints
    """
    logs = ApiTimingLog.objects.all()
    
    # Group by normalized path
    grouped_data = {}
    for log in logs:
        normalized_path = normalize_endpoint(log.path)
        if normalized_path not in grouped_data:
            grouped_data[normalized_path] = {'total_duration': 0, 'count': 0}
        
        grouped_data[normalized_path]['total_duration'] += float(log.duration)
        grouped_data[normalized_path]['count'] += 1
    
    # Calculate averages
    average_times = []
    for path, data in grouped_data.items():
        avg_duration = data['total_duration'] / data['count'] if data['count'] > 0 else 0
        average_times.append({
            'path': path,
            'average_duration': avg_duration,
            'request_count': data['count']
        })
    
    # Sort by average duration descending
    average_times.sort(key=lambda x: x['average_duration'], reverse=True)
    
    return JsonResponse(average_times, safe=False)

@csrf_exempt
def estimate_user_year_stats(request):
    """
    Statistics about users, like their year, school.
    """
    stats = EstimateUserYear.objects.aggregate(
        total_users=Count('user', distinct=True),
        average_year=Avg('year')
    )

    school_counts = EstimateUserYear.objects.values('school').annotate(
        count=Count('id')
    ).order_by('-count')

    return JsonResponse({
        'overall_stats': stats,
        'school_counts': list(school_counts)
    })

@csrf_exempt
def mau_dau(request):
    """
    Calculates Monthly Active Users (MAU) and Daily Active Users (DAU).
    """
    today = timezone.now().date()
    start_of_month = today.replace(day=1)
    yesterday = today - datetime.timedelta(days=1)

    mau = ApiTimingLog.objects.filter(timestamp__date__gte=start_of_month).values('user').distinct().count()
    dau = ApiTimingLog.objects.filter(timestamp__date=yesterday).values('user').distinct().count()

    return JsonResponse({'MAU': mau, 'DAU': dau})

@csrf_exempt
def average_session_per_user(request):
    """
    Average number of sessions per user.
    """
    # Get all distinct users
    all_users = User.objects.all()
    total_users = all_users.count()

    if total_users == 0:
        return JsonResponse({'average_sessions_per_user': 0})

    total_sessions = 0
    for user in all_users:
        # Get all session IDs for the current user
        sessions = ApiTimingLog.objects.filter(user=user).values('session_id').distinct().count()
        total_sessions += sessions

    average_sessions = total_sessions / total_users

    return JsonResponse({'average_sessions_per_user': average_sessions})

@csrf_exempt
def get_latest_precomputed_metrics(request):
    """
    Fetch the most recent precomputed metrics from the database.
    """
    try:
        latest_metrics = PrecomputedMetrics.objects.filter(name='dashboard_metrics').order_by('-created_at').first()
        if latest_metrics:
            return JsonResponse(latest_metrics.data, safe=False)
        else:
            return JsonResponse({'error': 'No metrics available'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)