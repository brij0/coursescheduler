from django.urls import path
from . import views

app_name = 'scheduler-api'

urlpatterns = [
    path('conflict_free_schedule/', views.conflict_free_schedule, name='conflict_free_schedule'),
    path('offered_terms/', views.get_offered_terms, name='get_offered_terms'),
    path('course_types/', views.get_course_types, name='get_course_types'),
    path('get_course_codes/', views.get_course_codes, name='get_course_codes'),
    path('get_section_numbers/', views.get_section_numbers, name='get_section_numbers'),
    path('search/', views.search_courses, name='search_courses'),
    path('submit_suggestion/', views.submit_suggestion, name='submit_suggestion'),
    path('upload_course_outline/', views.upload_course_outline, name='upload_course_outline'),
    path('add_to_calendar/', views.add_to_calendar, name='add_to_calendar'),
    path('insert_events/', views.insert_events_to_calendar, name='insert_events'),
]