import mysql.connector
import os
from dotenv import load_dotenv
import re
import django
django.setup()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coursescheduler.settings')
from django.db import transaction
from scheduler.models import Course, CourseEvent
from gpacalc.models import GradingScheme, AssessmentWeightage
from coopforum.models import Post as CoopPost
from django.contrib.auth import authenticate
import json
import logging
logger = logging.getLogger(__name__)
def get_db_connection():
    """
    Connect to the MySQL database using the credentials from environment variables.
    Returns:
        db_connection: A connection object to the MySQL database.
        db_cursor: A cursor object to execute queries.
    """
    # Load environment variables
    load_dotenv()
    try:
        db_connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        db_cursor = db_connection.cursor()
        logger.info("Connected to the database successfully!")
        return db_connection, db_cursor
    except mysql.connector.Error as err:
        logger.error(f"Error: {err}")
        return None, None
    
# Function to insert cleaned course sections from web scraping and insert their events into the database
def insert_cleaned_sections(courses_data):
    """
    Clean and add scraped course sections and their associated events to the database.
    Matches the MySQL schema with specific field lengths and constraints.

    Args:
        courses_data (dict): Dictionary with course codes as keys and 
                             dictionaries of term-section mappings as values
    """
    days_mapping = {
        "M": "Monday",
        "T": "Tuesday",
        "W": "Wednesday",
        "Th": "Thursday",
        "F": "Friday",
        "Sa": "Saturday",
        "Su": "Sunday"
    }
    db_connection, db_cursor = get_db_connection()
    # log_debug(f"course_data = {courses_data}")
    try:
        # Process each course
        for course_codes, term_sections in courses_data.items():
            # Process each term for the current course
            for term, sections in term_sections.items():
                logger.info(f"Processing term: {term}")
                
                # Process each section in the term
                for sectioninfo in sections:
                    # Clean and truncate section data
                    offered_term = term[:20] if term else ''  # VARCHAR(20)
                    section_name = sectioninfo.get('section_name', '')[:20]
                    seatsinfo = sectioninfo.get('seats', '0/0')[:20]
                    course_code = sectioninfo.get('course_code', 'Unknown')[:20]
                    instructors = ', '.join(sectioninfo.get('instructors', ['Unknown']))[:50]
                    course_type = sectioninfo.get('course_type', 'Unknown')[:20]
                    section_number = sectioninfo.get('section_number', '')[:20]
                    credits = sectioninfo.get('credits')  # Assuming credits is an integer
                    has_events = False
                    # Insert section into database
                    insert_section_query = """
                        INSERT INTO courses 
                        (offered_term, section_name, seats, instructor, course_type, course_code, section_number,credits,has_events)
                        VALUES (%s, %s, %s, %s, %s, %s, %s,%s, %s)
                    """
                    params = (
                        offered_term,
                        section_name,
                        seatsinfo,
                        instructors,
                        course_type,
                        course_code,  
                        section_number,
                        credits,
                        has_events
                    )
                    logger.info(f"Inserting section: {params}")
                    try:
                        db_cursor.execute(insert_section_query, params)
                        course_id = db_cursor.lastrowid
                
                    except Exception as e:
                        logger.error(f"Error inserting section {section_name} for course {course_code}: {e}")
                        continue
                    # Process meeting details
                    for meeting_detail in sectioninfo.get('meeting_details', []):
                        # Extract and clean times
                        times = meeting_detail.get('times', [])
                        
                        time_str = "TBD"
                        
                        if times:
                            # Parse and format time information
                            days_list = []
                            time_range = ""
                            date_range = ""
                            
                            for time_item in times:
                                # Check if it's a date range
                                if re.search(r'\d+/\d+/\d+\s*-\s*\d+/\d+/\d+', time_item):
                                    date_range = time_item
                                    continue
                                
                                # Extract days (could be multiple with /)
                                day_pattern = r'^([A-Za-z]+/)*[A-Za-z]+'
                                day_match = re.search(day_pattern, time_item)
                                
                                if day_match:
                                    day_str = day_match.group(0)
                                    if '/' in day_str:
                                        # Handle days like "T/F"
                                        day_parts = day_str.split('/')
                                        for part in day_parts:
                                            for abbr, full in days_mapping.items():
                                                if part == abbr:
                                                    days_list.append(full)
                                    else:
                                        # Handle single days
                                        for abbr, full in days_mapping.items():
                                            if day_str == abbr:
                                                days_list.append(full)
                                
                                # Extract time range
                                time_pattern = r'(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)'
                                time_match = re.search(time_pattern, time_item)
                                if time_match:
                                    time_range = f"{time_match.group(1)}-{time_match.group(2)}"
                            
                            # Format final time string
                            if days_list and time_range:
                                time_str = f"{', '.join(days_list)} {time_range}"
                                if date_range:
                                    time_str += f" ({date_range})"
                            elif date_range:
                                time_str = date_range

                        # Clean location
                        locations = meeting_detail.get('locations', [])
                        location = locations[0][:-3] if locations else "TBD"

                        # Clean event type
                        event_type = meeting_detail.get('event_type', 'Unknown').replace('TBD', '')[:50]
                        if not event_type:
                            event_type = 'Unknown'

                        # Skip unknown event types
                        if event_type.lower() == 'unknown':
                            continue
                        days_str = ", ".join(days_list) if days_list else "TBD"
                        time_range_str = time_range if time_range else "TBD"
                        date_range_str = date_range if date_range else ""
                        # Insert event
                        insert_event_query = """
                            INSERT INTO events 
                            (course_id, event_type, times, location, days, dates)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """
                        db_cursor.execute(insert_event_query, 
                                        (course_id, event_type, time_range_str, location, 
                                        days_str, date_range_str))

        db_connection.commit()
        logger.info("Successfully inserted all sections and events")
    except Exception as e:
        logger.error(f"An error occurred while adding data to the database: {e}")
        db_connection.rollback()
    finally:
        db_cursor.close()
        db_connection.close()

def batch_insert_events_with_schemes(events_list, course_id):
    """
    Insert multiple events and their grading schemes into the database.
    
    Args:
        events_list: List of event dictionaries with weightage schemes
        course_id: ID of the course to associate events with
        
    Expected event format:
    {
        'event_type': 'Assignment',
        'date': '2025-06-04',
        'days': 'Wednesday',
        'time': '23:59',
        'location': 'Online (CourseLink)',
        'description': 'Written Assignment 1 submission',
        'weightage': {'Scheme 1': 10, 'Scheme 2': 10, 'Scheme 3': 10},
        'grading_note': 'Optional note'
    }
    """
    try:
        course = Course.objects.get(course_id=course_id)
    except Course.DoesNotExist:
        logger.error(f"Course with ID {course_id} does not exist")
        raise ValueError(f"Course with ID {course_id} does not exist")
    
    # Collect all unique scheme names from all events
    all_scheme_names = set()
    for event in events_list:
        if 'weightage' in event and isinstance(event['weightage'], dict):
            all_scheme_names.update(event['weightage'].keys())
    
    # Use database transaction to ensure data consistency
    with transaction.atomic():
        
        # Step 1: Create or get grading schemes
        schemes = {}
        for scheme_name in all_scheme_names:
            scheme, created = GradingScheme.objects.get_or_create(
                course=course,
                name=scheme_name,
                defaults={
                    'description': f'{scheme_name}',
                    'is_default': scheme_name.lower() == 'default'
                }
            )
            schemes[scheme_name] = scheme
        
        # Step 2: Insert events and their weightages
        for event_data in events_list:
            # Create the CourseEvent
            course_event = CourseEvent.objects.create(
                course=course,
                event_type=event_data.get('event_type'),
                event_date=event_data.get('date'),
                start_date=event_data.get('start_date'),
                end_date=event_data.get('end_date'),
                days=','.join(event_data.get('days', [])) if isinstance(event_data.get('days'), list) else event_data.get('days', ''),
                time=event_data.get('time', ''),
                location=event_data.get('location', ''),
                description=event_data.get('description', ''),
                # Store the first scheme's weightage as default, or None if no weightages
                weightage=_get_default_weightage(event_data.get('weightage', {}))
            )
            
            # Create AssessmentWeightage entries for each scheme
            weightage_data = event_data.get('weightage', {})
            if isinstance(weightage_data, dict):
                for scheme_name, weight_value in weightage_data.items():
                    if scheme_name in schemes:
                        AssessmentWeightage.objects.create(
                            grading_scheme=schemes[scheme_name],
                            course_event=course_event,
                            weightage=float(weight_value)
                        )
            logger.info(f"Created event: {course_event.event_type} with {len(weightage_data)} scheme weightages")
    
    logger.info(f"Successfully inserted {len(events_list)} events with {len(all_scheme_names)} grading schemes")
    return {
        'events_created': len(events_list),
        'schemes_created': len(all_scheme_names),
        'schemes': list(all_scheme_names)
    }

def _get_default_weightage(weightage_dict):
    """
    Extract a default weightage value from the weightage dictionary.
    Priority: 'Default' > 'Scheme 1' > first available value > None
    """
    if not isinstance(weightage_dict, dict) or not weightage_dict:
        return None
    
    # Priority order for default weightage
    priority_keys = ['Default', 'default', 'Scheme 1', 'scheme 1']
    
    for key in priority_keys:
        if key in weightage_dict:
            return f"{weightage_dict[key]}%"
    
    # If no priority key found, use the first available
    first_value = list(weightage_dict.values())[0]
    return f"{first_value}%"

def get_section_details(school_code, course_code, section_number, offered_term):
    """
    Extract section information (event type, times, location) and course_id for a specific course and section.

    Args:
        school_code (str): School code (e.g., ENGG).
        course_code (str): Course code (e.g., 3450).
        section_number (str): Section number (e.g., 0201).

    Returns:
        dict: A dictionary with the course_id, course code, and a list of dictionaries containing event_type, times, and location for the section.
    """
    full_section_code = f"{school_code}*{course_code}*{section_number}"
    db_connection, db_cursor = get_db_connection()

    try:
        query = """
            SELECT c.course_id, e.event_type, e.times, e.location, e.days, e.dates
            FROM events e
            JOIN courses c ON e.course_id = c.course_id
            WHERE c.section_name = %s AND c.offered_term = %s
        """
        db_cursor.execute(query, (full_section_code, offered_term,))
        query_results = db_cursor.fetchall()

        # Extract course_id and section information
        section_details = {
            'course_id': None,  # Initialize with None in case no data is found
            'section_details': []
        }

        for result_row in query_results:
            if section_details['course_id'] is None:
                section_details['course_id'] = result_row[0]  # Set course_id from the first row
            section_details['section_details'].append({
                'event_type': result_row[1],
                'times': result_row[2],
                'location': result_row[3],
                'days': result_row[4],
                'dates': result_row[5]
            })

        return section_details
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {'course_id': None, 'section_details': []}
    finally:
        db_cursor.close()
        db_connection.close()


# Insert scrapped coop postings into the database

def insert_coop_postings():

    """
        Insert coop postings json into the database
    """
    load_dotenv()
    django_default_user, django_default_password = os.getenv("django_default_user"), os.getenv("django_default_password")
    if not django_default_user or not django_default_password:
        logger.error("Database credentials are not set in environment variables.")
        return False
    try:
        db_connection, db_cursor = get_db_connection()
        if not db_connection or not db_cursor:
            logger.error("Failed to connect to the database.")
            return False
        else:
            # Authenticate the user
            django_default_user = authenticate(username=django_default_user, password=django_default_password)
            if not django_default_user:
                logger.error("Authentication failed. Check your username and password.")
                return False
            
            # Fetch coop postings from the JSON file
            with open('coop_applied.json', 'r') as file:
                coop_postings = json.load(file)

            # Insert each posting into the database
            for posting in coop_postings:
                try:
                    # Check if a post with the same job_id already exists
                    if CoopPost.objects.filter(job_id=posting.get('job_id')).exists():
                        logger.warning(f"Skipping duplicate job_id: {posting.get('job_id')}")
                        continue  # Skip to the next posting
                    
                    post = CoopPost(
                        major= posting.get('major', 'Unknown'),
                        job_id=posting.get('job_id'),
                        job_term=posting.get('job_term'),
                        job_title=posting.get('job_title'),
                        organization=posting.get('organization'),
                        job_location=posting.get('job_location'),
                        content=posting.get('content', 'Share your experience here!'),
                        user=django_default_user
                    )
                    post.save()
                except Exception as e:
                    logger.error(f"Error inserting posting {posting.get('job_id')}: {e}")
            
            db_connection.commit()
            logger.info("Successfully inserted coop postings into the database.")
            return True

    except Exception as e:
        logger.error(f"Error: {e}")
        return False