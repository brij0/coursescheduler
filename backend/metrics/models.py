from django.db import models
from django.contrib.auth import get_user_model
import re

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
    
    def get_normalized_api_name(self):
        """
        Normalize API names by removing IDs and page numbers
        Examples:
        /api/users/123 -> /api/users/{id}
        /api/posts/456/comments -> /api/posts/{id}/comments
        /api/search?page=2 -> /api/search
        """
        if not self.api_name and not self.path:
            return "unknown"
            
        url = self.api_name or self.path
        
        # Remove query parameters
        url = url.split('?')[0]
        
        # Replace numeric IDs with placeholder
        # This regex finds numbers that are path segments (surrounded by /)
        url = re.sub(r'/\d+(?=/|$)', '/{id}', url)
        
        # Replace UUID-like patterns
        url = re.sub(r'/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=/|$)', '/{uuid}', url)
        
        # Replace other common ID patterns (alphanumeric strings longer than 10 chars)
        url = re.sub(r'/[a-zA-Z0-9]{10,}(?=/|$)', '/{id}', url)
        
        return url

class EstimateUserYear(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    year = models.IntegerField()
    school = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.year}: {self.school}"
    
class PrecomputedMetrics(models.Model):
    name = models.CharField(max_length=255)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.name} ({self.created_at})"