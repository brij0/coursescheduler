from .views import get_latest_precomputed_metrics
from django.urls import path

app_name = 'metrics-api'
urlpatterns = [
    path('', get_latest_precomputed_metrics, name='get_latest_precomputed_metrics'),
]
    