from django.db import models
from django.contrib.auth.models import User
from scheduler.models import Course, CourseEvent

class CourseGrade(models.Model):
    """
    Represents a student's grade for a specific course.
    
    This model stores the calculated grade data for a course, including the 
    final percentage, letter grade, and GPA value.
    
    API relevance:
    - Created when 'calculate_gpa' endpoint is called
    - Each course grade has multiple assessment grades
    - Final calculations appear in API responses
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    final_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    letter_grade = models.CharField(max_length=2, null=True, blank=True)
    gpa_value = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    def calculate_from_assessments(self):
        """
        Calculate final percentage, letter grade and GPA value from assessment grades.
        
        This method:
        1. Aggregates all assessment grades weighted by their respective percentages
        2. Determines the letter grade based on grading scale
        3. Maps the letter grade to a GPA value
        """
        assessments = self.assessmentgrade_set.all()
        
        if not assessments:
            self.final_percentage = None
            self.letter_grade = None
            self.gpa_value = None
            self.save()
            return
            
        total_weight = 0
        weighted_sum = 0
        
        for assessment in assessments:
            if assessment.weightage and assessment.achieved_percentage is not None:
                weight = float(assessment.weightage)
                achieved = float(assessment.achieved_percentage)
                weighted_sum += (achieved * weight / 100)
                total_weight += weight
        
        # Calculate final percentage if we have assessments with weights
        if total_weight > 0:
            self.final_percentage = round(weighted_sum * 100 / total_weight, 2)
            
            # Map percentage to letter grade
            if self.final_percentage >= 90:
                self.letter_grade = "A+"
                self.gpa_value = 4.0
            elif self.final_percentage >= 85:
                self.letter_grade = "A"
                self.gpa_value = 4.0
            elif self.final_percentage >= 80:
                self.letter_grade = "A-"
                self.gpa_value = 3.7
            elif self.final_percentage >= 77:
                self.letter_grade = "B+"
                self.gpa_value = 3.3
            elif self.final_percentage >= 73:
                self.letter_grade = "B"
                self.gpa_value = 3.0
            elif self.final_percentage >= 70:
                self.letter_grade = "B-"
                self.gpa_value = 2.7
            elif self.final_percentage >= 67:
                self.letter_grade = "C+"
                self.gpa_value = 2.3
            elif self.final_percentage >= 63:
                self.letter_grade = "C"
                self.gpa_value = 2.0
            elif self.final_percentage >= 60:
                self.letter_grade = "C-"
                self.gpa_value = 1.7
            elif self.final_percentage >= 57:
                self.letter_grade = "D+"
                self.gpa_value = 1.3
            elif self.final_percentage >= 53:
                self.letter_grade = "D"
                self.gpa_value = 1.0
            elif self.final_percentage >= 50:
                self.letter_grade = "D-"
                self.gpa_value = 0.7
            else:
                self.letter_grade = "F"
                self.gpa_value = 0.0
        else:
            self.final_percentage = None
            self.letter_grade = None
            self.gpa_value = None
        
        self.save()
    
    def __str__(self):
        return f"{self.course} - {self.letter_grade or 'Not graded'}"
    
    class Meta:
        db_table = 'gpacalc_coursegrade'


class AssessmentGrade(models.Model):
    """
    Represents a student's grade for a specific assessment within a course.
    
    This model connects a course grade to individual assessment components
    and stores the achieved percentage for each assessment.
    
    API relevance:
    - Created from assessment data submitted to 'calculate_gpa' endpoint
    - Represents individual components (midterms, finals, assignments, etc.)
    - Each course has multiple assessments with different weights
    """
    course_grade = models.ForeignKey(CourseGrade, on_delete=models.CASCADE)
    course_event = models.ForeignKey(CourseEvent, on_delete=models.CASCADE)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    achieved_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{self.course_event.event_type} - {self.achieved_percentage}%"
    
    class Meta:
        ordering = ['course_event__event_type']
        db_table = 'gpacalc_assessmentgrade'


class GpaCalcProgress(models.Model):
    """
    Stores a user's progress and results from the GPA calculator.
    
    This model maintains the state of a user's GPA calculation session,
    allowing them to return to their previous work.
    
    API relevance:
    - Updated whenever 'calculate_gpa' endpoint is called by authenticated users
    - Retrieved when user visits the index endpoint
    - Contains serialized calculation results and input selections
    - Used for restoring a previous session and for Excel exports
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"GPA Progress for {self.user.username}"