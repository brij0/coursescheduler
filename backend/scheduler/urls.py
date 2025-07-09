from django.urls import path
from . import views

app_name = 'scheduler'

urlpatterns = [
    path('', views.index, name='index'),  
    path('privacy/', views.privacy_policy, name='privacy_policy'),
]