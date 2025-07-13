from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings


User = get_user_model()

class AppSession(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    section_name = models.CharField(max_length=100, blank=True, null=True)
    app_name = models.CharField(max_length=50)
    session_id = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    last_api_call_time = models.DateTimeField(auto_now=True)
    duration = models.DurationField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'app_name', 'session_id','section_name')

class UserYearEstimate(models.Model):
    offered_term = models.CharField(max_length=20, blank=True, null=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    session = models.CharField(max_length=100, blank=True, null=True)
    school = models.CharField(max_length=100, blank=True, null=True)
    estimated_year = models.CharField(max_length=20)
    courses = models.JSONField()
    source = models.CharField(max_length=50, default="gpacalc")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('offered_term', 'user')

class CoursetypetoSchool(models.Model):
    course_type = models.CharField(max_length=50)
    school = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.course_type} - {self.school}"

class ApiTimingLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    session_id = models.CharField(max_length=64, null=True, blank=True)  # Add this line
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    api_name = models.CharField(max_length=100)
    duration = models.FloatField()
    status_code = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    extra = models.JSONField(null=True, blank=True)