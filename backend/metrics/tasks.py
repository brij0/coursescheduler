from celery import shared_task
from metrics.models import ApiTimingLog, EstimateUserYear, PrecomputedMetrics
import json
from collections import Counter
from django.db.models import Count, Q, Avg
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
from django.db.models.functions import TruncHour

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
            }
        )
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)

@shared_task(bind=True)
def estimate_user_year(self, request_data):
    try:
        payload = json.loads(request_data)
        course_list = payload.get("courses", [])

        # Step 1: Normalize course identifiers
        course_keys = [
            course.get('course_type', '')
            for course in course_list
        ]

        # Step 2: Find the most common course
        if course_keys:
            most_common_course = Counter(course_keys).most_common(1)[0][0]
        else:
            most_common_course = None

        # Step 3: Get most common first digit of course codes
        course_codes = [str(course.get("course_code", "")) for course in course_list if course.get("course_code")]
        first_digits = [int(code[0]) for code in course_codes if code and code[0].isdigit()]
        most_common_first_digit = Counter(first_digits).most_common(1)[0][0] if first_digits else None

        if payload.get("session_id"):
            try:
                EstimateUserYear.objects.update_or_create(
                    user_id= payload.get("user_id") or None,
                    session_id=payload.get("session_id"),
                    defaults={
                        'year': most_common_first_digit,
                        'school': most_common_course
                    }
                )
            except Exception as e:
                return {"status": "error", "detail": str(e)}
        
        return {"status": "success", "year": most_common_first_digit, "school": most_common_course}
        
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@shared_task(bind=True)
def calculate_and_store_metrics(self):
    try:
        # Calculate error rates per endpoint per status code
        error_rates = (
            ApiTimingLog.objects
            .values('api_name', 'status_code')
            .annotate(count=Count('id'))
            .filter(status_code__gte=400)
        )
        error_rates_dict = {
            f"{item['api_name']} - {item['status_code']}": item['count']
            for item in error_rates
        }
        
        # Calculate average response time per normalized API endpoint
        all_logs = ApiTimingLog.objects.all()
        api_performance = {}
        
        for log in all_logs:
            normalized_api = log.get_normalized_api_name()
            if normalized_api not in api_performance:
                api_performance[normalized_api] = []
            api_performance[normalized_api].append(log.duration)
        
        # Calculate statistics for each API
        api_stats = {}
        for api_name, durations in api_performance.items():
            if durations:
                durations.sort()
                length = len(durations)
                api_stats[api_name] = {
                    'avg_duration': sum(durations) / length,
                    'min_duration': min(durations),
                    'max_duration': max(durations),
                    'p50_duration': durations[int(length * 0.5)],
                    'p95_duration': durations[int(length * 0.95)],
                    'p99_duration': durations[int(length * 0.99)] if length > 0 else durations[-1],
                    'request_count': length
                }
        
        # Calculate overall p95 and p99 latency
        latency = list(ApiTimingLog.objects.order_by('duration').values_list('duration', flat=True))
        p95 = latency[int(len(latency) * 0.95)] if len(latency) > 0 else None
        p99 = latency[int(len(latency) * 0.99)] if len(latency) > 0 else None
        
        # Calculate overall average response time
        avg_response_time = ApiTimingLog.objects.aggregate(avg_duration=Avg('duration'))['avg_duration']

        # Calculate MAU and DAU
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        start_of_week = today - datetime.timedelta(days=today.weekday())
        
        mau = ApiTimingLog.objects.filter(timestamp__date__gte=start_of_month).values('user').distinct().count()
        wau = ApiTimingLog.objects.filter(timestamp__date__gte=start_of_week).values('user').distinct().count()
        dau = ApiTimingLog.objects.filter(timestamp__date=today).values('user').distinct().count()
        das = ApiTimingLog.objects.filter(timestamp__date=today).values('session_id').distinct().count()

        # Calculate average sessions per user
        all_users = User.objects.all()
        total_users = all_users.count()
        if total_users > 0:
            total_sessions = sum(
                ApiTimingLog.objects.filter(user=user).values('session_id').distinct().count() 
                for user in all_users
            )
            average_sessions_per_user = total_sessions / total_users
        else:
            average_sessions_per_user = 0

        # Calculate request volume metrics
        last_24_hours = timezone.now() - datetime.timedelta(hours=24)
        last_7_days = timezone.now() - datetime.timedelta(days=7)
        
        # Hourly volume for last 24 hours
        hourly_volume = ApiTimingLog.objects.filter(
            timestamp__gte=last_24_hours
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            request_count=Count('id')
        ).order_by('hour')
        
        # Convert to list and handle datetime serialization
        hourly_volume_data = []
        for item in hourly_volume:
            hourly_volume_data.append({
                'hour': item['hour'].isoformat() if item['hour'] else None,
                'request_count': item['request_count']
            })
        
        # Calculate total requests for different time periods
        total_requests_24h = ApiTimingLog.objects.filter(timestamp__gte=last_24_hours).count()
        total_requests_7d = ApiTimingLog.objects.filter(timestamp__gte=last_7_days).count()
        total_requests_30d = ApiTimingLog.objects.filter(timestamp__gte=start_of_month).count()
        
        # Calculate success rate
        total_requests = ApiTimingLog.objects.count()
        successful_requests = ApiTimingLog.objects.filter(
            Q(status_code__lt=400) | Q(status_code__isnull=True)
        ).count()
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Calculate top slowest APIs
        slowest_apis = sorted(api_stats.items(), key=lambda x: x[1]['avg_duration'], reverse=True)[:10]
        
        # Calculate most popular APIs
        most_popular_apis = sorted(api_stats.items(), key=lambda x: x[1]['request_count'], reverse=True)[:10]
        
        # Calculate error distribution
        error_distribution = {}
        for status_code in [400, 401, 403, 404, 429, 500, 502, 503, 504]:
            count = ApiTimingLog.objects.filter(status_code=status_code).count()
            if count > 0:
                error_distribution[str(status_code)] = count
        
        # Calculate peak hours (hours with most requests)
        peak_hours = (
            ApiTimingLog.objects
            .filter(timestamp__gte=last_7_days)
            .annotate(hour=TruncHour('timestamp'))
            .values('hour')
            .annotate(request_count=Count('id'))
            .order_by('-request_count')[:5]
        )
        
        peak_hours_data = [
            {
                'hour': item['hour'].strftime('%Y-%m-%d %H:00') if item['hour'] else None,
                'request_count': item['request_count']
            }
            for item in peak_hours
        ]

        # Store precomputed metrics
        PrecomputedMetrics.objects.create(
            name='dashboard_metrics',
            data={
                # Response time metrics
                'api_performance': api_stats,
                'avg_response_time': avg_response_time,
                'p95_latency': p95,
                'p99_latency': p99,
                'slowest_apis': dict(slowest_apis),
                
                # Usage metrics
                'mau': mau,
                'wau': wau,
                'dau': dau,
                'das': das,
                'average_sessions_per_user': average_sessions_per_user,
                'most_popular_apis': dict(most_popular_apis),
                
                # Volume metrics
                'total_requests_24h': total_requests_24h,
                'total_requests_7d': total_requests_7d,
                'total_requests_30d': total_requests_30d,
                'hourly_volume': hourly_volume_data,
                'peak_hours': peak_hours_data,
                
                # Error metrics
                'error_rates': error_rates_dict,
                'success_rate': success_rate,
                'error_distribution': error_distribution,
                
                # System health
                'total_endpoints': len(api_stats),
                'total_users': total_users,
            }
        )
        
        return "Metrics calculated and stored successfully"
        
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)