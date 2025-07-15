# scheduler/models.py
from django.db import models

class Course(models.Model):
    offered_term = models.CharField(max_length=20, null=True, blank=True)
    course_id      = models.AutoField(primary_key=True)
    course_type    = models.CharField(max_length=20)
    course_code    = models.CharField(max_length=20)
    section_number = models.CharField(max_length=20)
    section_name   = models.CharField(max_length=50)
    seats          = models.CharField(max_length=50)
    instructor     = models.CharField(max_length=50)
    credits       = models.FloatField(null=True, blank=True, default= 0.5)

    class Meta:
        db_table = "courses"
        unique_together = ("offered_term","course_type", "course_code", "section_number")

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
    event_date   = models.DateField(null=True, blank=True,)
    start_date   = models.DateField(null=True, blank=True)
    end_date     = models.DateField(null=True, blank=True)
    days         = models.CharField(max_length=100, default="")
    time         = models.CharField(max_length=50, default="")
    location     = models.CharField(max_length=255, default="")
    description  = models.TextField()
    weightage    = models.CharField(max_length=50, null=True, blank=True)

class Suggestion(models.Model):
    text         = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

class Event(models.Model):
    id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey('Course', on_delete=models.CASCADE, db_column='course_id')
    event_type = models.CharField(max_length=50)
    times = models.CharField(max_length=100)
    location = models.CharField(max_length=255, null=True, blank=True, default="")
    days = models.CharField(max_length=50, null=True, blank=True, default="")
    dates = models.CharField(max_length=100, null=True, blank=True, default="")

    class Meta:
        db_table = "events"