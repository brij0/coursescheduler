from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings


User = get_user_model()

class ApiTimingLog(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    api_name = models.CharField(max_length=255, null=True, blank=True)
    duration = models.FloatField(help_text="Time in seconds")
    status_code = models.IntegerField(null=True, blank=True)
    extra = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.path} ({self.status_code}) - {self.duration:.3f}s"

class EstimateUserYear(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    year = models.IntegerField()
    school = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        unique_together = ('user', 'session_id')

    def __str__(self):
        return f"{self.user.username} - {self.year}: {self.school}"