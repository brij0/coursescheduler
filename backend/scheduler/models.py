# scheduler/models.py
from django.db import models

class Course(models.Model):
    course_id      = models.AutoField(primary_key=True)  # Add this line
    course_type    = models.CharField(max_length=20)
    course_code    = models.CharField(max_length=20)
    section_number = models.CharField(max_length=20)
    section_name   = models.CharField(max_length=50)
    seats          = models.CharField(max_length=50)
    instructor     = models.CharField(max_length=50)

    class Meta:
        db_table = "courses"

    def __str__(self):
        return f"{self.course_type}*{self.course_code}*{self.section_number}"
    
class CourseDropdown(models.Model):
    course_type = models.CharField(max_length=20)
    course_code = models.CharField(max_length=20)
    section_number = models.CharField(max_length=20)

    class Meta:
        db_table = "course_dropdown"

    def __str__(self):
        return f"{self.course_type} {self.course_code} {self.section_number}"

class CourseEvent(models.Model):
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="events")
    event_type   = models.CharField(max_length=50)
    event_date   = models.DateField(null=True, blank=True)
    start_date   = models.DateField(null=True, blank=True)
    end_date     = models.DateField(null=True, blank=True)
    days         = models.CharField(max_length=100)
    time         = models.CharField(max_length=50)
    location     = models.CharField(max_length=255)
    description  = models.TextField()
    weightage    = models.CharField(max_length=50, null=True, blank=True)

class Suggestion(models.Model):
    text         = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
