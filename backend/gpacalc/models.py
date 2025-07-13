from django.db import models
from scheduler.models import Course, CourseEvent
from django.conf import settings

class GradingScheme(models.Model):
    """
    Defines a grading scheme for a course with a name and description.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="grading_schemes")
    name = models.CharField(max_length=100)  # e.g., "Standard", "Alternative", etc.
    description = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "gpacalc_gradingscheme"
        unique_together = ['course', 'name']

    def __str__(self):
        return f"{self.course}: {self.name}"

class AssessmentWeightage(models.Model):
    """
    Defines weightage for a course event within a specific grading scheme.
    """
    grading_scheme = models.ForeignKey(GradingScheme, on_delete=models.CASCADE, related_name="weightages")
    course_event = models.ForeignKey(CourseEvent, on_delete=models.CASCADE, related_name="scheme_weightages")
    weightage = models.DecimalField(max_digits=5, decimal_places=2)  # Weight in percentage
    
    class Meta:
        db_table = "gpacalc_assessmentweightage"
        unique_together = ['grading_scheme', 'course_event']

    def __str__(self):
        return f"{self.grading_scheme.name}: {self.course_event.event_type} ({self.weightage}%)"

class GradeScale(models.Model):
    """
    Maps a minimum percentage to a letter grade and its GPA value.
    """
    letter_grade    = models.CharField(max_length=5)   # e.g. "A+", "A", "A-"
    gpa_value       = models.DecimalField(max_digits=3, decimal_places=2)  # e.g. 4.00, 3.70
    min_percentage  = models.DecimalField(max_digits=5, decimal_places=2)  # e.g. 90.00

    class Meta:
        ordering = ['-min_percentage']

    def __str__(self):
        return f"{self.letter_grade} ({self.gpa_value})"

class CourseGrade(models.Model):
    """
    Holds the computed grade for one Course.
    """
    course           = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="grades")
    final_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    letter_grade     = models.CharField(max_length=5, null=True, blank=True)
    gpa_value        = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "gpacalc_coursegrade"

    def __str__(self):
        return f"{self.course}: {self.letter_grade or 'N/A'} ({self.gpa_value or 0.0})"

    def calculate_from_assessments(self):
        """
        Sum up all linked AssessmentGrades to compute final_percentage,
        then look up the corresponding GradeScale entry.
        """
        assessments = self.assessments.all()
        if not assessments:
            return

        total = sum((a.weightage * a.achieved_percentage / 100) for a in assessments)
        self.final_percentage = round(total, 2)

        # find matching scale
        scale = GradeScale.objects.filter(min_percentage__lte=self.final_percentage).order_by('-min_percentage').first()
        if scale:
            self.letter_grade = scale.letter_grade
            self.gpa_value    = scale.gpa_value
        self.save()

class AssessmentGrade(models.Model):
    """
    Records the percentage the student achieved on one CourseEvent.
    """
    course_grade        = models.ForeignKey(CourseGrade, on_delete=models.CASCADE, related_name="assessments")
    course_event        = models.ForeignKey(CourseEvent, on_delete=models.SET_NULL, null=True, blank=True)
    weightage           = models.DecimalField(max_digits=5, decimal_places=2)    # from CourseEvent.weightage
    achieved_percentage = models.DecimalField(max_digits=5, decimal_places=2)    # user input

    class Meta:
        db_table  = "gpacalc_assessmentgrade"
        ordering  = ['course_event__event_type']

    def __str__(self):
        ev = self.course_event.event_type if self.course_event else "Unknown event"
        return f"{ev}: {self.achieved_percentage}% ({self.weightage}% of course)"

#Added a new model so user can save their progress in the GPA calculator
class GpaCalcProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    data = models.JSONField()
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"GPA Progress for {self.user or self.session_key}"