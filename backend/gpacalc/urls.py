from django.urls import path, include
from . import views

"""
Main URL patterns for the GPA Calculator application

The main entry point redirects to the API index for retrieving initial data.
For all API functionality, use the api_urls.py patterns.
"""

app_name = 'gpacalc'

urlpatterns = [
    # Main entry point - returns basic data and saved progress
]