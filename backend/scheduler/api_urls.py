from django.urls import path
from . import views
from gpacalc import views as gpacalc_views
app_name = 'scheduler-api'

urlpatterns = [
    path('conflict_free_schedule/', views.conflict_free_schedule, name='conflict_free_schedule'),
    path('offered_terms/', gpacalc_views.get_offered_terms, name='get_offered_terms'),
    path('course_types/', gpacalc_views.get_course_types, name='get_course_types'),
    path('course_codes/', gpacalc_views.get_course_codes, name='get_course_codes'),
    path('section_numbers/', gpacalc_views.get_section_numbers, name='get_section_numbers'),
    path('course_events_schedule/', views.course_events_schedule, name='search_courses'),
    path('submit_suggestion/', views.submit_suggestion, name='submit_suggestion'),
    # path('upload_course_outline/', views.upload_course_outline, name='upload_course_outline'),
    path('course_events', gpacalc_views.get_course_events, name='get_course_events'),
    path('add_to_calendar/', views.add_to_calendar, name='add_to_calendar'),
    path('insert_events/', views.insert_events_to_calendar, name='insert_events'),
    path('events_view/', views.course_events_schedule, name='events_view'),
]