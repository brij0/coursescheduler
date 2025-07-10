from django.urls import path
from . import views

app_name = 'scheduler'

urlpatterns = [
    path('', views.index, name='index'),  
    path('conflictfree_home/', views.conflict_test, name='schedule'),
    path('conflictfree_schedule/', views.conflict_free_schedule, name='conflict_free_schedule'),
    path('privacy/', views.privacy_policy, name='privacy_policy'),
]