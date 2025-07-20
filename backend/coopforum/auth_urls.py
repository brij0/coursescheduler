from django.urls import path
from . import views

app_name = 'auth-api'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('user/', views.user_view, name='user'),
    path('register/', views.register_view, name='register'),
    path('verify-email/<uuid:token>/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
]