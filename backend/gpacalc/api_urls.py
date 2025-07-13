from django.urls import path
from . import views

"""
API endpoints for the GPA Calculator application

These endpoints provide JSON-based access to:
- Course and term data
- Assessment details
- GPA calculation functionality
- Excel export capability

All POST endpoints expect JSON request bodies and return JSON responses.
The GET endpoints either return JSON data or file downloads (Excel export).
"""

app_name = 'gpacalc-api'

urlpatterns = [
    # Course selection endpoints
    path('offered_terms/', views.get_offered_terms, name='get_offered_terms'),
    path('course_types/', views.get_course_types, name='get_course_types'),
    path('course_codes/', views.get_course_codes, name='get_course_codes'),
    path('section_numbers/', views.get_section_numbers, name='get_section_numbers'),
    path('course_events/', views.get_course_events, name='get_course_events'),
    
    # Calculation and export endpoints
    path('calculate/', views.calculate_gpa, name='calculate_gpa'),
    path('progress_export_excel/', views.progress_export_excel, name='progress_export_excel'),
]