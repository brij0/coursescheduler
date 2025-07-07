from django.urls import path
from . import views

app_name = 'scheduler'

urlpatterns = [
    path('api/course_types/', views.get_course_types, name='get_course_types'),
    path('api/get_course_codes/', views.get_course_codes, name='get_course_codes'),
    path('api/get_section_numbers/', views.get_section_numbers, name='get_section_numbers'),
    path('api/search/', views.search_courses, name='search_courses'),
    path('api/conflict_free_schedule/', views.conflict_free_schedule, name='conflict_free_schedule'),
    path('api/submit_suggestion/', views.submit_suggestion, name='submit_suggestion'),
    path('api/upload_course_outline/', views.upload_course_outline, name='upload_course_outline'),
    path('privacy/', views.privacy_policy, name='privacy_policy'),
]