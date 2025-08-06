# scheduler/models.py
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Course(models.Model):
    offered_term = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    course_id      = models.AutoField(primary_key=True)
    course_type    = models.CharField(max_length=20,db_index=True)
    course_code    = models.CharField(max_length=20)
    section_number = models.CharField(max_length=20)
    section_name   = models.CharField(max_length=50)
    seats          = models.CharField(max_length=50)
    instructor     = models.CharField(max_length=50)
    credits       = models.FloatField(null=True, blank=True, default= 0.5)
    has_events = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "courses"
        unique_together = ("offered_term","course_type", "course_code", "section_number")
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['offered_term', 'has_events']),
            models.Index(fields=['offered_term', 'course_type', 'has_events']),
        ]

    def __str__(self):
        return f"{self.course_type}*{self.course_code}*{self.section_number}"
    
    def update_has_events(self):
        """Helper method to update has_events field"""
        self.has_events = self.events.exists()
        self.save(update_fields=['has_events'])
    
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

# AUTOMATIC MAINTENANCE - This keeps has_events in sync
@receiver(post_save, sender=CourseEvent)
def update_course_has_events_on_save(sender, instance, created, **kwargs):
    """When a CourseEvent is created or updated, ensure course.has_events = True"""
    if instance.course.has_events != True:
        instance.course.has_events = True
        instance.course.save(update_fields=['has_events'])

@receiver(post_delete, sender=CourseEvent)
def update_course_has_events_on_delete(sender, instance, **kwargs):
    """When a CourseEvent is deleted, check if course still has events"""
    course = instance.course
    # Check if this was the last event for this course
    if not course.events.exists():
        course.has_events = False
        course.save(update_fields=['has_events'])

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

class ConflictFreeSchedules(models.Model):
    id = models.AutoField(primary_key=True)
    offered_term = models.CharField(max_length=20, db_index=True)
    courses = models.TextField(max_length=1000, null=True, blank=True,default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    conflict_free = models.JSONField(help_text="List of conflict-free schedules")