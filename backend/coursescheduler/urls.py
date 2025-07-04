# scheduler/urls.py
from django.urls import path
from backend.scheduler import views
from django.contrib import admin
app_name = 'scheduler'

urlpatterns = [
    # Main pages
    path('admin/', admin.site.urls),  # This line is missing
    path('', views.index, name='index'),
    path('privacy/', views.privacy_policy, name='privacy'),
    
    # API endpoints
    path('api/course_types/', views.get_course_types, name='get_course_types'),
    path('api/get_course_codes/', views.get_course_codes, name='get_course_codes'),
    path('api/get_section_numbers/', views.get_section_numbers, name='get_section_numbers'),
    path('api/search/', views.search_courses, name='search_courses'),
    path('api/submit_suggestion/', views.submit_suggestion, name='submit_suggestion'),
    path('api/upload_course_outline/', views.upload_course_outline, name='upload_course_outline'),
    
    # Calendar functionality
    path('add_to_calendar/', views.add_to_calendar, name='add_to_calendar'),
    path('insert_events/', views.insert_events_to_calendar, name='insert_events'),
    
    # Legacy endpoints (for backward compatibility)
    path('course_types/', views.get_course_types, name='course_types_legacy'),
    path('get_course_codes/', views.get_course_codes, name='course_codes_legacy'),
    path('get_section_numbers/', views.get_section_numbers, name='section_numbers_legacy'),
    path('search/', views.search_courses, name='search_legacy'),
    path('submit_suggestion/', views.submit_suggestion, name='suggestion_legacy'),
]