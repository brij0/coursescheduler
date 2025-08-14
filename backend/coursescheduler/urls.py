from django.urls import path, include
from django.contrib import admin
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from coopforum import forum_views
from metrics.prometheus import metrics_view
# DRF router for CoopForum API
router = DefaultRouter()
router.register(r'posts', forum_views.PostViewSet, basename='coopforum-post')
router.register(r'comments', forum_views.CommentViewSet, basename='coopforum-comment')

urlpatterns = [
    # API endpoints
    path('api/scheduler/', include('scheduler.api_urls', namespace='scheduler-api')),
    path('api/gpacalc/', include('gpacalc.api_urls', namespace='gpacalc-api')),
    path('api/coopforum/', include((router.urls, 'coopforum'), namespace='coopforum-api')),
    path('api/metrics/', include('metrics.api_urls', namespace='metrics-api')),
    # Authentication API endpoints
    path('api/auth/', include('coopforum.auth_urls', namespace='auth-api')),

    # For Prometheus metrics endpoint
    path('metrics/', metrics_view, name='prometheus_metrics'),
]