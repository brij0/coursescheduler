from django.urls import path, include
from django.contrib import admin
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from coopforum import views as forum_views

# DRF router for CoopForum API
router = DefaultRouter()
router.register(r'posts', forum_views.PostViewSet, basename='coopforum-post')
router.register(r'comments', forum_views.CommentViewSet, basename='coopforum-comment')

def api_root(request):
    return JsonResponse({
        'message': 'SmartGryph Backend API is running!',
        'version': '1.0',
        'available_endpoints': {
            'authentication': '/api/auth/',
            'scheduler': '/api/scheduler/',
            'gpa_calculator': '/api/gpacalc/',
            'coop_forum': '/api/coopforum/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    # Root endpoint
    path('', api_root, name='api_root'),
    
    # Admin & main pages
    path('admin/', admin.site.urls),
    path('scheduler/', include('scheduler.urls', namespace='scheduler')),  # Scheduler web pages
    path('gpacalc/', include('gpacalc.urls', namespace='gpacalc')),  # GPA calculator web pages
    path('forum/', include('coopforum.urls', namespace='coopforum')),  # CoopForum web pages

    # API endpoints
    path('api/scheduler/', include('scheduler.api_urls', namespace='scheduler-api')),
    path('api/gpacalc/', include('gpacalc.api_urls', namespace='gpacalc-api')),
    path('api/coopforum/', include((router.urls, 'coopforum'), namespace='coopforum-api')),

    # Authentication API endpoints
    path('api/auth/', include('coopforum.auth_urls', namespace='auth-api')),
]