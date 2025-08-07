from .views import error_rates_by_endpoint, p95_p99_latency, request_volume_over_time,mau_dau, api_usage_patterns, average_time_per_endpoint, estimate_user_year_stats
from django.urls import path

app_name = 'metrics-api'
urlpatterns = [
    path('error_rates/', error_rates_by_endpoint, name='error_rates_by_endpoint'),
    path('latency/p95_p99/', p95_p99_latency, name='p95_p99_latency'),
    path('request_volume/', request_volume_over_time, name='request_volume_over_time'),
    path('mau_dau/', mau_dau, name='mau_dau'),
    path('api_usage_patterns/', api_usage_patterns, name='api_usage_patterns'),
    path('average_time_per_endpoint/', average_time_per_endpoint, name='average_time_per_endpoint'),
    path('estimate_user_year_stats/', estimate_user_year_stats, name='estimate_user_year_stats'),
]
    