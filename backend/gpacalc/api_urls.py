from django.urls import path
from . import views

app_name = 'gpacalc-api'

urlpatterns = [
    path('get_offered_terms/', views.get_offered_terms, name = 'get_offered_terms'),
    path('course_types/', views.get_course_types, name='get_course_types'),
    path('course_codes/', views.get_course_codes, name='get_course_codes'),
    path('section_numbers/', views.get_section_numbers, name='get_section_numbers'),
    path('course_events/', views.get_course_events, name='get_course_events'),
    path('calculate/', views.calculate_gpa, name='calculate_gpa'),
]