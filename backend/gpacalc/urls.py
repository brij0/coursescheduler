from django.urls import path
from . import views

app_name = 'gpacalc'
urlpatterns = [
  path('', views.index, name='index'),  # GPA calculator page (GET)
  path('course_codes/', views.get_course_codes, name='get_course_codes'),  # AJAX: get codes for type
  path('section_numbers/', views.get_section_numbers, name='get_section_numbers'),  # AJAX: get sections for code
  path('course_events/', views.get_course_events, name='get_course_events'),  # AJAX: get events for section
  path('calculate/', views.calculate_gpa, name='calculate_gpa'),  # POST: calculate GPA
]
