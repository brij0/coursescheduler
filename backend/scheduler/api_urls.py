from django.urls import path
from . import views
from gpacalc import views as gpacalc_views

app_name = 'scheduler-api'

urlpatterns = [
    #Basic API endpoints to get offered terms, course types, course codes, and section numbers
    path('offered_terms/', gpacalc_views.get_offered_terms, name='get_offered_terms'),
    path('course_types/', gpacalc_views.get_course_types, name='get_course_types'),
    path('course_codes/', gpacalc_views.get_course_codes, name='get_course_codes'),
    path('section_numbers/', gpacalc_views.get_section_numbers, name='get_section_numbers'),

    #API endpoint to get the conflict free schedule
    path('conflict_free_schedule/', views.conflict_free_schedule, name='conflict_free_schedule'),

    #API endpoint to get the course events, you'll need to provide the offered term and course_type, course_code and section_number
    path('course_events_schedule/', views.course_events_schedule, name='search_courses'),
    #API endpoint to export the course events in ICS format
    path('export_events/', views.export_events_ics_format, name='export_event'),

    #API endpoint to submit suggestions
    path('submit_suggestion/', views.submit_suggestion, name='submit_suggestion'),
]