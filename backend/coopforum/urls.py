from django.urls import path
from . import views

app_name = 'coopforum'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/user/', views.user_view, name='user'),
]