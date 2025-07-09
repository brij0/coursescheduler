from django.urls import path
from . import views

app_name = 'gpacalc'
urlpatterns = [
    path('', views.index, name='index'),
]