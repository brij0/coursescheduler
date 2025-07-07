from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin
from backend.scheduler import views as scheduler_views
from backend.coopforum import views as coop_views

app_name = 'scheduler'

# DRF router for coopforum (threaded posts & comments)
router = DefaultRouter()
router.register(r'posts', coop_views.PostViewSet, basename='coopforum-post')
router.register(r'comments', coop_views.CommentViewSet, basename='coopforum-comment')

urlpatterns = [
    # Admin & main pages
    path('admin/', admin.site.urls),
    path('', scheduler_views.index, name='index'),
    path('privacy/', scheduler_views.privacy_policy, name='privacy'),
    path('forum/', include('backend.coopforum.urls', namespace='coopforum')),
    path('gpacalc/', include('backend.gpacalc.urls', namespace='gpacalc')),

    # Authentication API endpoints
    path('api/auth/login/', coop_views.login_view, name='api_login'),
    path('api/auth/logout/', coop_views.logout_view, name='api_logout'),
    path('api/auth/user/', coop_views.user_view, name='api_user'),

    # Existing API endpoints for course scheduler
    path('api/course_types/', scheduler_views.get_course_types, name='get_course_types'),
    path('api/get_course_codes/', scheduler_views.get_course_codes, name='get_course_codes'),
    path('api/get_section_numbers/', scheduler_views.get_section_numbers, name='get_section_numbers'),
    path('api/search/', scheduler_views.search_courses, name='search_courses'),
    path('api/submit_suggestion/', scheduler_views.submit_suggestion, name='submit_suggestion'),
    path('api/upload_course_outline/', scheduler_views.upload_course_outline, name='upload_course_outline'),
    path('add_to_calendar/', scheduler_views.add_to_calendar, name='add_to_calendar'),
    path('insert_events/', scheduler_views.insert_events_to_calendar, name='insert_events'),
    # Legacy endpoints (backward compatibility)
    path('course_types/', scheduler_views.get_course_types, name='course_types_legacy'),
    path('get_course_codes/', scheduler_views.get_course_codes, name='course_codes_legacy'),
    path('get_section_numbers/', scheduler_views.get_section_numbers, name='section_numbers_legacy'),
    path('search/', scheduler_views.search_courses, name='search_legacy'),
    path('submit_suggestion/', scheduler_views.submit_suggestion, name='suggestion_legacy'),

    # Coopforum API (threaded posts & comments)
    path('api/coopforum/', include((router.urls, 'coopforum'), namespace='coopforum')),
]