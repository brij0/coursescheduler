from collections import deque, defaultdict
from datetime import datetime
from typing import List, Dict, Set, Optional, Tuple
import logging

# Django imports
from django.conf import settings
import django
if not settings.configured:
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coursescheduler.settings')
    django.setup()
from django.db import connection
from django.db.models import Q, Prefetch
from scheduler.models import (
    DegPlannerProgram, 
    DegPlannerCourse, 
    DegPlannerPrerequisite,
    DegPlannerProgramRequirement,
    DegPlannerProgramSequence
)
logger = logging.getLogger(__name__)

class CourseScheduler:
    def __init__(self):
        """Initialize the course scheduler with Django ORM integration"""
        self.prerequisite_graph = defaultdict(list)
        self.in_degree = defaultdict(int)
        self.course_offerings = {}
        self.course_credits = {}
        self.program_courses = set()
        
    def build_prerequisite_graph(self, program_id: int) -> None:
        """Build graph of course prerequisites for a program using Django ORM"""
        try:
            logger.info(f"Building prerequisite graph for program {program_id}")
            
            # Clear previous graph
            self.prerequisite_graph = defaultdict(list)
            self.in_degree = defaultdict(int)
            self.program_courses = set()
            
            # Get all required courses for the program with prerequisites prefetched
            program_requirements = DegPlannerProgramRequirement.objects.filter(
                program_id=program_id,
                is_required=True
            ).select_related('course').prefetch_related(
                Prefetch(
                    'course__prerequisites',
                    queryset=DegPlannerPrerequisite.objects.select_related('prerequisite')
                )
            )
            
            # Build set of required courses
            for req in program_requirements:
                course_code = req.course.course_code
                self.program_courses.add(course_code)
                self.course_credits[course_code] = float(req.course.credits or 0.5)
                
                # Store course offerings
                self.course_offerings[course_code] = {
                    'fall': req.course.typically_offered_fall,
                    'winter': req.course.typically_offered_winter,
                    'summer': req.course.typically_offered_summer
                }
            
            # Build prerequisite relationships
            for req in program_requirements:
                course_code = req.course.course_code
                
                # Process all prerequisites for this course
                mandatory_prereqs = []
                optional_groups = defaultdict(list)
                
                for prereq_rel in req.course.prerequisites.all():
                    prereq_code = prereq_rel.prerequisite.course_code
                    
                    # Only include prerequisites that are part of this program
                    if prereq_code in self.program_courses:
                        if prereq_rel.requirement_type == 'mandatory':
                            mandatory_prereqs.append(prereq_code)
                        elif prereq_rel.requirement_type == 'optional':
                            optional_groups['or_group'].append(prereq_code)
                        elif prereq_rel.requirement_type.startswith('n_of_'):
                            n_required = prereq_rel.requirement_type.split('_')[-1]
                            optional_groups[f'n_of_{n_required}'].append(prereq_code)
                
                # Add mandatory prerequisites to graph
                for prereq_code in mandatory_prereqs:
                    self.prerequisite_graph[prereq_code].append(course_code)
                    self.in_degree[course_code] += 1
                
                # Handle optional prerequisites (simplified: treat as mandatory for now)
                # TODO: Implement advanced logic for OR/N-of requirements
                for group_type, prereq_codes in optional_groups.items():
                    if group_type == 'or_group' and prereq_codes:
                        # For OR groups, require at least one (take first for simplicity)
                        prereq_code = prereq_codes[0]
                        self.prerequisite_graph[prereq_code].append(course_code)
                        self.in_degree[course_code] += 1
                    elif group_type.startswith('n_of_'):
                        # For N-of groups, require N courses (simplified)
                        n_required = int(group_type.split('_')[-1])
                        for prereq_code in prereq_codes[:n_required]:
                            self.prerequisite_graph[prereq_code].append(course_code)
                            self.in_degree[course_code] += 1
                
                # Initialize in_degree for courses with no prerequisites
                if course_code not in self.in_degree:
                    self.in_degree[course_code] = 0
            
            logger.info(f"Built graph with {len(self.program_courses)} courses, "
                       f"{sum(len(deps) for deps in self.prerequisite_graph.values())} dependencies")
                    
        except Exception as e:
            logger.error(f"Error building prerequisite graph: {e}")
            raise
    
    def is_offered_in_semester(self, course_code: str, semester: str) -> bool:
        """Check if a course is offered in the given semester"""
        try:
            if course_code not in self.course_offerings:
                # Fallback: query database if not cached
                course = DegPlannerCourse.objects.get(course_code=course_code)
                self.course_offerings[course_code] = {
                    'fall': course.typically_offered_fall,
                    'winter': course.typically_offered_winter,
                    'summer': course.typically_offered_summer
                }
            
            season = semester.split()[0].lower()
            offerings = self.course_offerings[course_code]
            
            return offerings.get(season, False)
            
        except DegPlannerCourse.DoesNotExist:
            logger.warning(f"Course not found: {course_code}")
            return False
        except Exception as e:
            logger.error(f"Error checking course offerings for {course_code}: {e}")
            return False
    
    def get_next_semester(self, current_semester: str) -> str:
        """Get the next semester based on current semester"""
        seasons = ['Fall', 'Winter', 'Summer']
        try:
            current_season, current_year = current_semester.split()
            current_year = int(current_year)
            
            current_index = seasons.index(current_season)
            next_index = (current_index + 1) % len(seasons)
            
            if next_index == 0:  # Wrapped around to next year
                current_year += 1
                
            return f"{seasons[next_index]} {current_year}"
            
        except (ValueError, IndexError) as e:
            logger.error(f"Error parsing semester '{current_semester}': {e}")
            return "Fall 2024"  # Fallback
    
    def detect_circular_dependencies(self) -> None:
        """Detect circular dependencies using Kahn's algorithm"""
        logger.info("Checking for circular dependencies...")
        
        in_degree_copy = self.in_degree.copy()
        queue = deque([course for course, degree in in_degree_copy.items() if degree == 0])
        processed = 0
        
        while queue:
            course = queue.popleft()
            processed += 1
            
            for dependent in self.prerequisite_graph.get(course, []):
                in_degree_copy[dependent] -= 1
                if in_degree_copy[dependent] == 0:
                    queue.append(dependent)
        
        if processed != len(in_degree_copy):
            circular_courses = [course for course, degree in in_degree_copy.items() if degree > 0]
            error_msg = f"Circular dependency detected in courses: {circular_courses}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        logger.info("No circular dependencies found")
    
    def get_available_courses(self, completed_courses: Set[str]) -> List[str]:
        """Get courses that can be taken now (all prerequisites satisfied)"""
        available = []
        for course, degree in self.in_degree.items():
            if course not in completed_courses and degree == 0:
                available.append(course)
        return available
    
    def calculate_semester_credits(self, courses: List[str]) -> float:
        """Calculate total credits for a list of courses"""
        return sum(self.course_credits.get(course, 0.5) for course in courses)
    
    def select_optimal_courses(self, available_courses: List[str], semester: str, 
                             max_courses: int = 5, max_credits: float = 2.5) -> List[str]:
        """Select optimal courses for a semester based on constraints"""
        if not available_courses:
            return []
        
        # Filter by semester availability
        semester_available = [
            course for course in available_courses 
            if self.is_offered_in_semester(course, semester)
        ]
        
        if not semester_available:
            logger.warning(f"No courses available for {semester} from: {available_courses}")
            return []
        
        # Sort by credits (prioritize higher credit courses for efficiency)
        semester_available.sort(key=lambda c: self.course_credits.get(c, 0.5), reverse=True)
        
        # Select courses within constraints
        selected = []
        total_credits = 0.0
        
        for course in semester_available:
            course_credits = self.course_credits.get(course, 0.5)
            
            # Check if adding this course exceeds limits
            if (len(selected) >= max_courses or 
                total_credits + course_credits > max_credits):
                break
            
            selected.append(course)
            total_credits += course_credits
        
        logger.debug(f"Selected {len(selected)} courses ({total_credits:.1f} credits) for {semester}")
        return selected
    
    def generate_schedule(self, completed_courses: List[str], program_id: int, 
                         starting_semester: str, max_courses_per_semester: int = 5,
                         max_credits_per_semester: float = 2.5) -> Dict[str, List[str]]:
        """Generate optimal schedule using topological sort with constraints"""
        try:
            logger.info(f"Generating schedule for program {program_id}, starting {starting_semester}")
            
            # Build prerequisite graph and check for circular dependencies
            self.build_prerequisite_graph(program_id)
            self.detect_circular_dependencies()
            
            if not self.program_courses:
                logger.warning("No courses found for this program")
                return {}
            
            # Remove completed courses from graph
            completed_set = set(completed_courses)
            logger.info(f"Starting with {len(completed_set)} completed courses")
            
            for course in completed_set:
                if course in self.prerequisite_graph:
                    for dependent in self.prerequisite_graph[course]:
                        if dependent in self.in_degree:
                            self.in_degree[dependent] -= 1
                            
                # Remove from in_degree if it exists
                self.in_degree.pop(course, None)
            
            schedule = {}
            current_semester = starting_semester
            semester_count = 0
            max_semesters = 24  # Safety limit (8 years)
            
            while self.in_degree and semester_count < max_semesters:
                available = self.get_available_courses(completed_set)
                
                if not available:
                    remaining_courses = list(self.in_degree.keys())
                    if remaining_courses:
                        logger.warning(f"Cannot schedule remaining courses: {remaining_courses}")
                        # Check what prerequisites are missing
                        for course in remaining_courses[:5]:  # Limit output
                            logger.warning(f"{course} still needs {self.in_degree[course]} prerequisites")
                    break
                
                # Select optimal courses for this semester
                selected_courses = self.select_optimal_courses(
                    available, current_semester, max_courses_per_semester, max_credits_per_semester
                )
                
                if selected_courses:
                    schedule[current_semester] = selected_courses
                    total_credits = self.calculate_semester_credits(selected_courses)
                    logger.info(f"{current_semester}: {len(selected_courses)} courses ({total_credits:.1f} credits)")
                    
                    # Update graph: remove scheduled courses and update dependencies
                    for course in selected_courses:
                        completed_set.add(course)
                        for dependent in self.prerequisite_graph.get(course, []):
                            if dependent in self.in_degree:
                                self.in_degree[dependent] -= 1
                        self.in_degree.pop(course, None)
                else:
                    logger.info(f"{current_semester}: No courses available")
                
                # Move to next semester
                current_semester = self.get_next_semester(current_semester)
                semester_count += 1
            
            remaining_courses = len(self.in_degree)
            if remaining_courses > 0:
                logger.warning(f"Could not schedule {remaining_courses} courses")
            
            total_scheduled = sum(len(courses) for courses in schedule.values())
            logger.info(f"Successfully scheduled {total_scheduled} courses over {len(schedule)} semesters")
            
            return schedule
            
        except ValueError as e:
            logger.error(f"Scheduling error: {e}")
            return {'error': str(e)}
        except Exception as e:
            logger.error(f"Unexpected error in schedule generation: {e}")
            return {'error': f"Unexpected error: {str(e)}"}
    
    def get_schedule_statistics(self, schedule: Dict[str, List[str]]) -> Dict:
        """Calculate statistics for a generated schedule"""
        if not schedule or 'error' in schedule:
            return {'error': 'No valid schedule to analyze'}
        
        stats = {
            'total_semesters': len(schedule),
            'total_courses': sum(len(courses) for courses in schedule.values()),
            'total_credits': 0.0,
            'avg_courses_per_semester': 0.0,
            'avg_credits_per_semester': 0.0,
            'semester_breakdown': {}
        }
        
        for semester, courses in schedule.items():
            semester_credits = self.calculate_semester_credits(courses)
            stats['total_credits'] += semester_credits
            stats['semester_breakdown'][semester] = {
                'courses': len(courses),
                'credits': semester_credits
            }
        
        if len(schedule) > 0:
            stats['avg_courses_per_semester'] = stats['total_courses'] / len(schedule)
            stats['avg_credits_per_semester'] = stats['total_credits'] / len(schedule)
        
        return stats

# Usage example with Django integration
def main():
    """Example usage of the improved course scheduler"""
    try:
        # Get a program (replace with actual program selection logic)
        program = DegPlannerProgram.objects.filter(
            program_name__icontains="Computer Engineering (CENG) Major"
        ).first()
        
        if not program:
            print("No Computer Science program found")
            return
        
        # Initialize scheduler
        scheduler = CourseScheduler()
        
        # Example completed courses
        completed_courses = ["CHEM*1140", "ENGG*1100","ENGG*1410", "MATH*1200","PHYS*1130", "ENGG*1210", "ENGG*1420","ENGG*1500","MATH*1210", "PHYS*1010"]
        
        # Generate schedule
        schedule = scheduler.generate_schedule(
            completed_courses=completed_courses,
            program_id=program.id,
            starting_semester="Fall 2023",
            max_courses_per_semester=6,
            max_credits_per_semester=3.25
        )
        
        # Display results
        if 'error' in schedule:
            print(f"Error: {schedule['error']}")
        else:
            print(f"\n🎓 Generated Schedule for {program.program_name}:")
            print("=" * 60)
            
            for semester, courses in schedule.items():
                credits = scheduler.calculate_semester_credits(courses)
                print(f"\n📅 {semester} ({len(courses)} courses, {credits:.1f} credits):")
                for course in courses:
                    course_credits = scheduler.course_credits.get(course, 0.5)
                    print(f"  • {course} ({course_credits} credits)")
            
            # Show statistics
            stats = scheduler.get_schedule_statistics(schedule)
            print(f"\n📊 Schedule Statistics:")
            print(f"  • Total Duration: {stats['total_semesters']} semesters")
            print(f"  • Total Courses: {stats['total_courses']}")
            print(f"  • Total Credits: {stats['total_credits']:.1f}")
            print(f"  • Average per Semester: {stats['avg_courses_per_semester']:.1f} courses, "
                  f"{stats['avg_credits_per_semester']:.1f} credits")
            
    except Exception as e:
        print(f"Error: {e}")
        logger.error(f"Main execution error: {e}")

if __name__ == "__main__":
    main()