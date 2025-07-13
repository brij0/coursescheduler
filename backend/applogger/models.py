from django.db import models
from django.contrib.auth import get_user_model

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