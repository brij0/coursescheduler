import json
import sys
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal, InvalidOperation
import django
from django.conf import settings
from django.db import transaction

# Configure Django settings if not already configured
if not settings.configured:
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coursescheduler.settings')
    django.setup()

from scheduler.models import (
    DegPlannerProgram, 
    DegPlannerCourse, 
    DegPlannerPrerequisite,
    DegPlannerProgramRequirement,
    DegPlannerProgramSequence
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self):
        self.programs_data: Optional[Dict] = None
        self.courses_data: Optional[List] = None
        self.course_id_cache: Dict[str, int] = {}
        self.program_id_cache: Dict[str, int] = {}
        
    def load_json_data(self, programs_file: str, courses_file: str) -> None:
        """Load JSON data from files with comprehensive error handling"""
        try:
            with open(programs_file, 'r', encoding='utf-8') as f:
                self.programs_data = json.load(f)
            
            with open(courses_file, 'r', encoding='utf-8') as f:
                self.courses_data = json.load(f)
            
            logger.info(f"Loaded {len(self.programs_data)} programs and {len(self.courses_data)} courses")
            
            # Validate data structure
            if not isinstance(self.programs_data, dict):
                raise ValueError("Programs data must be a dictionary")
            if not isinstance(self.courses_data, list):
                raise ValueError("Courses data must be a list")
                
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {e}")
            sys.exit(1)
        except ValueError as e:
            logger.error(f"Data validation error: {e}")
            sys.exit(1)
    
    # def review_program(self, program_name: str, program_data: Dict) -> str:
    #     """Display program data for review - COMMENTED OUT FOR AUTO-MIGRATION"""
    #     print(f"\n=== REVIEWING PROGRAM: {program_name} ===")
    #     print(f"Credit Summary: {json.dumps(program_data.get('credit_summary', {}), indent=2)}")
        
    #     print("\nProgram Sequence:")
    #     for semester, courses in program_data.get('program_sequence', {}).items():
    #         print(f"  {semester}:")
    #         for course in courses:
    #             for course_code, credits in course.items():
    #                 print(f"    - {course_code}: {credits} credits")
        
    #     return input("\nPress: [a]dd, [s]kip, [e]dit, [q]uit: ").lower()
    
    # def review_course(self, course: Dict) -> str:
    #     """Display course data for review - COMMENTED OUT FOR AUTO-MIGRATION"""
    #     print(f"\n=== REVIEWING COURSE: {course.get('course_code', 'N/A')} ===")
    #     print(f"Title: {course.get('course_title', 'N/A')}")
    #     print(f"Credits: {course.get('credits', 'N/A')}")
    #     print(f"Offered: {course.get('offered_terms', 'N/A')}")
    #     print(f"Prerequisites: {course.get('course_prerequisites', 'N/A')}")
    #     desc = course.get('course_description', '')
    #     print(f"Description: {desc[:100]}{'...' if len(desc) > 100 else ''}")
        
        return input("\nPress: [a]dd, [s]kip, [e]dit, [q]uit: ").lower()
    
    def parse_credits(self, credits_input: Any) -> Decimal:
        """Parse credits with robust error handling"""
        if credits_input is None:
            return Decimal('0.5')
        
        try:
            # Handle string inputs
            if isinstance(credits_input, str):
                # Remove brackets and clean up
                credits_str = re.sub(r'[\[\]]', '', credits_input)
                
                # Handle range formats (e.g., "3 to 6", "3-6")
                if 'to' in credits_str:
                    credits_str = credits_str.split('to')[0].strip()
                elif '-' in credits_str:
                    credits_str = credits_str.split('-')[0].strip()
                
                # Remove non-numeric characters except decimal point
                credits_str = re.sub(r'[^\d.]', '', credits_str)
                
                if credits_str:
                    return Decimal(credits_str)
            
            # Handle numeric inputs
            return Decimal(str(credits_input))
            
        except (InvalidOperation, ValueError) as e:
            logger.warning(f"Invalid credit value '{credits_input}': {e}. Using default 0.5")
            return Decimal('0.5')
    
    def parse_offered_terms(self, offered_terms: str) -> Tuple[bool, bool, bool]:
        """Parse offered terms into boolean flags"""
        if not offered_terms:
            return False, False, False
        
        terms = offered_terms.lower()
        fall = 'fall' in terms
        winter = 'winter' in terms
        summer = 'summer' in terms
        
        return fall, winter, summer
    
    @transaction.atomic
    def migrate_courses(self) -> None:
        """Migrate courses using Django ORM with bulk operations"""
        logger.info("Starting course migration...")
        
        courses_to_create = []
        courses_to_update = []
        existing_codes = set(DegPlannerCourse.objects.values_list('course_code', flat=True))
        
        for course_data in self.courses_data:
            course_code = course_data.get('course_code')
            if not course_code:
                logger.warning("Skipping course with no course_code")
                continue
            
            # Uncomment below lines to enable interactive review
            # action = self.review_course(course_data)
            # if action == 's':
            #     continue
            # elif action == 'q':
            #     logger.info("Migration aborted by user")
            #     return
            # elif action == 'e':
            #     logger.info("Edit functionality not implemented yet - skipping")
            #     continue
            
            fall, winter, summer = self.parse_offered_terms(course_data.get('offered_terms', ''))
            credits = self.parse_credits(course_data.get('credits'))
            
            course_obj = DegPlannerCourse(
                course_code=course_code,
                course_title=course_data.get('course_title', '')[:200],  # Ensure max length
                credits=credits,
                description=course_data.get('course_description', ''),
                typically_offered_fall=fall,
                typically_offered_winter=winter,
                typically_offered_summer=summer,
                restrictions=course_data.get('course_restrictions', ''),
                offerings=course_data.get('course_offerings', ''),
                prerequisites_text=course_data.get('course_prerequisites', '')
            )
            
            if course_code in existing_codes:
                # Update existing course
                course_obj.id = DegPlannerCourse.objects.get(course_code=course_code).id
                courses_to_update.append(course_obj)
                logger.info(f"Prepared update for course: {course_code}")
            else:
                # Create new course
                courses_to_create.append(course_obj)
                logger.info(f"Prepared creation for course: {course_code}")
        
        # Bulk create new courses
        if courses_to_create:
            try:
                created_courses = DegPlannerCourse.objects.bulk_create(
                    courses_to_create, 
                    batch_size=100,
                    ignore_conflicts=True
                )
                logger.info(f"Successfully created {len(created_courses)} courses")
            except Exception as e:
                logger.error(f"Error bulk creating courses: {e}")
                raise
        
        # Bulk update existing courses
        if courses_to_update:
            try:
                DegPlannerCourse.objects.bulk_update(
                    courses_to_update,
                    ['course_title', 'credits', 'description', 'typically_offered_fall',
                     'typically_offered_winter', 'typically_offered_summer', 
                     'restrictions', 'offerings', 'prerequisites_text'],
                    batch_size=100
                )
                logger.info(f"Successfully updated {len(courses_to_update)} courses")
            except Exception as e:
                logger.error(f"Error bulk updating courses: {e}")
                raise
        
        # Build course ID cache for later use
        self.course_id_cache = dict(
            DegPlannerCourse.objects.values_list('course_code', 'id')
        )
        logger.info(f"Built course ID cache with {len(self.course_id_cache)} entries")
    
    @transaction.atomic
    def migrate_programs(self) -> None:
        """Migrate programs using Django ORM with bulk operations"""
        logger.info("Starting program migration...")
        
        programs_to_create = []
        programs_to_update = []
        existing_names = set(DegPlannerProgram.objects.values_list('program_name', flat=True))
        
        for program_name, program_data in self.programs_data.items():
            # Uncomment below lines to enable interactive review
            # action = self.review_program(program_name, program_data)
            # if action == 's':
            #     continue
            # elif action == 'q':
            #     logger.info("Migration aborted by user")
            #     return
            # elif action == 'e':
            #     logger.info("Edit functionality not implemented yet - skipping")
            #     continue
            
            is_coop = 'Co-op' in program_name or 'coop' in program_name.lower()
            credit_summary = program_data.get('credit_summary', {})
            
            program_obj = DegPlannerProgram(
                program_name=program_name,
                is_coop=is_coop,
                total_credits=None,  # Could be calculated from credit_summary
                credit_requirements=credit_summary
            )
            
            if program_name in existing_names:
                # Update existing program
                program_obj.id = DegPlannerProgram.objects.get(program_name=program_name).id
                programs_to_update.append(program_obj)
                logger.info(f"Prepared update for program: {program_name}")
            else:
                # Create new program
                programs_to_create.append(program_obj)
                logger.info(f"Prepared creation for program: {program_name}")
        
        # Bulk create new programs
        if programs_to_create:
            try:
                created_programs = DegPlannerProgram.objects.bulk_create(
                    programs_to_create, 
                    batch_size=100,
                    ignore_conflicts=True
                )
                logger.info(f"Successfully created {len(created_programs)} programs")
            except Exception as e:
                logger.error(f"Error bulk creating programs: {e}")
                raise
        
        # Bulk update existing programs
        if programs_to_update:
            try:
                DegPlannerProgram.objects.bulk_update(
                    programs_to_update,
                    ['is_coop', 'total_credits', 'credit_requirements'],
                    batch_size=100
                )
                logger.info(f"Successfully updated {len(programs_to_update)} programs")
            except Exception as e:
                logger.error(f"Error bulk updating programs: {e}")
                raise
        
        # Build program ID cache for later use
        self.program_id_cache = dict(
            DegPlannerProgram.objects.values_list('program_name', 'id')
        )
        logger.info(f"Built program ID cache with {len(self.program_id_cache)} entries")
    
    @transaction.atomic
    def migrate_program_sequences(self) -> None:
        """Migrate program sequences using Django ORM with bulk operations"""
        logger.info("Starting program sequence migration...")
        
        # Clear existing sequences for programs we're updating
        program_ids = list(self.program_id_cache.values())
        deleted_count = DegPlannerProgramSequence.objects.filter(
            program_id__in=program_ids
        ).delete()[0]
        logger.info(f"Deleted {deleted_count} existing program sequences")
        
        sequences_to_create = []
        
        for program_name, program_data in self.programs_data.items():
            program_id = self.program_id_cache.get(program_name)
            if not program_id:
                logger.warning(f"Program ID not found for: {program_name}")
                continue
            
            semester_order = 0
            for semester, courses in program_data.get('program_sequence', {}).items():
                semester_order += 1
                
                for course_item in courses:
                    for course_code, credits in course_item.items():
                        is_elective = (
                            'elective' in course_code.lower() or 
                            'credits from' in course_code.lower()
                        )
                        
                        # Handle long course codes
                        if len(course_code) > 200:  # Updated to match model max_length
                            short_code = f"ELEC-{semester_order}-{hash(course_code) % 1000}"
                            logger.warning(f"Truncated long course code: {course_code}")
                        else:
                            short_code = course_code
                        
                        elective_category = course_code if is_elective else None
                        credit_value = self.parse_credits(credits)
                        
                        sequence_obj = DegPlannerProgramSequence(
                            program_id=program_id,
                            semester_name=semester[:500],  # Ensure max length
                            semester_order=semester_order,
                            course_code=short_code,
                            credits=credit_value,
                            is_elective_category=is_elective,
                            elective_category=elective_category[:100] if elective_category else None
                        )
                        
                        sequences_to_create.append(sequence_obj)
        
        # Bulk create sequences
        if sequences_to_create:
            try:
                created_sequences = DegPlannerProgramSequence.objects.bulk_create(
                    sequences_to_create,
                    batch_size=100
                )
                logger.info(f"Successfully created {len(created_sequences)} program sequences")
            except Exception as e:
                logger.error(f"Error bulk creating program sequences: {e}")
                raise
    
    @transaction.atomic
    def link_courses_to_programs(self) -> None:
        """Create program-course relationships needed for scheduling"""
        logger.info("Starting program-course relationship creation...")
        
        # Clear existing relationships for programs we're updating
        program_ids = list(self.program_id_cache.values())
        deleted_count = DegPlannerProgramRequirement.objects.filter(
            program_id__in=program_ids
        ).delete()[0]
        logger.info(f"Deleted {deleted_count} existing program requirements")
        
        requirements_to_create = []
        
        for program_name, program_data in self.programs_data.items():
            program_id = self.program_id_cache.get(program_name)
            if not program_id:
                logger.warning(f"Program ID not found for: {program_name}")
                continue
            
            # Track courses already added to avoid duplicates
            added_courses = set()
            
            for semester, courses in program_data.get('program_sequence', {}).items():
                for course_item in courses:
                    for course_code, credits in course_item.items():
                        # Skip electives and non-course entries
                        if ('elective' in course_code.lower() or 
                            'credits from' in course_code.lower() or
                            course_code in added_courses):
                            continue
                        
                        course_id = self.course_id_cache.get(course_code)
                        if course_id:
                            requirement_obj = DegPlannerProgramRequirement(
                                program_id=program_id,
                                course_id=course_id,
                                requirement_type='core',  # Could be determined from context
                                is_required=True
                            )
                            requirements_to_create.append(requirement_obj)
                            added_courses.add(course_code)
                        else:
                            logger.warning(f"Course not found for requirement: {course_code}")
        
        # Bulk create requirements
        if requirements_to_create:
            try:
                created_requirements = DegPlannerProgramRequirement.objects.bulk_create(
                    requirements_to_create,
                    batch_size=100,
                    ignore_conflicts=True
                )
                logger.info(f"Successfully created {len(created_requirements)} program requirements")
            except Exception as e:
                logger.error(f"Error bulk creating program requirements: {e}")
                raise
    
    def parse_prerequisites_advanced(self, prereq_text: str) -> Dict[str, List[str]]:
        """Parse prerequisite text into structured format"""
        if not prereq_text.strip():
            return {'mandatory': [], 'optional_groups': []}
        
        # Extract course codes
        course_pattern = r'[A-Z]{2,4}\*?[0-9]{4}'
        all_courses = re.findall(course_pattern, prereq_text)
        
        result = {
            'mandatory': [],
            'optional_groups': []
        }
        
        # Find OR groups
        or_pattern = r'([A-Z]{2,4}\*?[0-9]{4})\s*or\s*([A-Z]{2,4}\*?[0-9]{4})'
        or_matches = re.findall(or_pattern, prereq_text, re.IGNORECASE)
        
        or_courses = set()
        for match in or_matches:
            group_courses = list(match)
            result['optional_groups'].append(group_courses)
            or_courses.update(group_courses)
        
        # Find "N of X" patterns
        n_of_pattern = r'(\d+)\s+of\s*([A-Z0-9\*,\s]+)'
        n_of_matches = re.findall(n_of_pattern, prereq_text, re.IGNORECASE)
        
        for n_required, course_list in n_of_matches:
            group_courses = re.findall(course_pattern, course_list)
            if group_courses:
                result['optional_groups'].append({
                    'type': 'n_of',
                    'n_required': int(n_required),
                    'courses': group_courses
                })
                or_courses.update(group_courses)
        
        # Remaining courses are mandatory
        result['mandatory'] = [course for course in all_courses if course not in or_courses]
        
        return result
    
    @transaction.atomic
    def migrate_prerequisites(self) -> None:
        """Parse and migrate prerequisite relationships"""
        logger.info("Starting prerequisite migration...")
        
        # Clear existing prerequisites
        DegPlannerPrerequisite.objects.all().delete()
        logger.info("Cleared existing prerequisites")
        
        prerequisites_to_create = []
        
        for course_data in self.courses_data:
            course_code = course_data.get('course_code')
            prereq_text = course_data.get('course_prerequisites', '')
            
            if not course_code or not prereq_text.strip():
                continue
            
            course_id = self.course_id_cache.get(course_code)
            if not course_id:
                logger.warning(f"Course ID not found for: {course_code}")
                continue
            
            # Parse prerequisites
            prereq_structure = self.parse_prerequisites_advanced(prereq_text)
            
            # Add mandatory prerequisites
            for prereq_code in prereq_structure['mandatory']:
                prereq_id = self.course_id_cache.get(prereq_code)
                if prereq_id:
                    prerequisites_to_create.append(
                        DegPlannerPrerequisite(
                            course_id=course_id,
                            prerequisite_id=prereq_id,
                            requirement_type='mandatory'
                        )
                    )
                    logger.debug(f"Added mandatory prerequisite: {prereq_code} for {course_code}")
            
            # Add optional/OR prerequisites
            for group in prereq_structure['optional_groups']:
                if isinstance(group, dict) and group.get('type') == 'n_of':
                    # Handle "N of X" requirements
                    requirement_type = f"n_of_{group['n_required']}"
                    for prereq_code in group['courses']:
                        prereq_id = self.course_id_cache.get(prereq_code)
                        if prereq_id:
                            prerequisites_to_create.append(
                                DegPlannerPrerequisite(
                                    course_id=course_id,
                                    prerequisite_id=prereq_id,
                                    requirement_type=requirement_type
                                )
                            )
                elif isinstance(group, list):
                    # Handle simple OR requirements
                    for prereq_code in group:
                        prereq_id = self.course_id_cache.get(prereq_code)
                        if prereq_id:
                            prerequisites_to_create.append(
                                DegPlannerPrerequisite(
                                    course_id=course_id,
                                    prerequisite_id=prereq_id,
                                    requirement_type='optional'
                                )
                            )
        
        # Bulk create prerequisites
        if prerequisites_to_create:
            try:
                created_prereqs = DegPlannerPrerequisite.objects.bulk_create(
                    prerequisites_to_create,
                    batch_size=100,
                    ignore_conflicts=True
                )
                logger.info(f"Successfully created {len(created_prereqs)} prerequisites")
            except Exception as e:
                logger.error(f"Error bulk creating prerequisites: {e}")
                raise
    
    def migrate_data(self) -> None:
        """Main migration function with comprehensive error handling"""
        logger.info("Starting comprehensive data migration...")
        
        try:
            # Step 1: Migrate courses first (needed for foreign keys)
            self.migrate_courses()
            
            # Step 2: Migrate programs
            self.migrate_programs()
            
            # Step 3: Migrate program sequences
            self.migrate_program_sequences()
            
            # Step 4: Link courses to programs (needed for CourseScheduler)
            self.link_courses_to_programs()
            
            # Step 5: Parse and migrate prerequisites
            self.migrate_prerequisites()
            
            logger.info("✅ Migration completed successfully!")
            
            # Print summary statistics
            self.print_migration_summary()
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise
    
    def print_migration_summary(self) -> None:
        """Print comprehensive migration summary"""
        try:
            course_count = DegPlannerCourse.objects.count()
            program_count = DegPlannerProgram.objects.count()
            sequence_count = DegPlannerProgramSequence.objects.count()
            requirement_count = DegPlannerProgramRequirement.objects.count()
            prerequisite_count = DegPlannerPrerequisite.objects.count()
            
            print("\n" + "="*50)
            print("MIGRATION SUMMARY")
            print("="*50)
            print(f"📚 Courses: {course_count}")
            print(f"🎓 Programs: {program_count}")
            print(f"📅 Program Sequences: {sequence_count}")
            print(f"📋 Program Requirements: {requirement_count}")
            print(f"🔗 Prerequisites: {prerequisite_count}")
            print("="*50)
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")

def main():
    """Main function with comprehensive error handling"""
    
    # File paths
    programs_file = "all_major_requirements.json"
    courses_file = "course_details.json"
    
    # Initialize the migrator
    migrator = DatabaseMigrator()
    
    try:
        logger.info("Starting database migration process...")
        
        # Load JSON data
        migrator.load_json_data(programs_file, courses_file)
        
        # Confirm migration start
        print("\n🚀 Starting automated migration (review functions are commented out)")
        print("📝 Check migration.log for detailed progress")
        
        # Start the migration process
        migrator.migrate_data()
        
        print("\n✅ Migration completed! Check the logs for details.")
        
    except KeyboardInterrupt:
        logger.info("Migration interrupted by user")
        print("\n⏹️ Migration stopped by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error during migration: {e}")
        print(f"\n❌ Migration failed: {e}")
        print("📋 Check migration.log for detailed error information")
        sys.exit(1)

if __name__ == "__main__":
    main()