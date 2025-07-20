from django.urls import path
from . import views

app_name = 'coopforum'

urlpatterns = [
    path('', views.index, name='index'),
]