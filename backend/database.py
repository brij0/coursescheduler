from httpx import get
import mysql.connector
import os
from dotenv import load_dotenv
# from timetable import *
# from scrape_course import *
import re

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
        print("Connected to the database successfully!")
        return db_connection, db_cursor
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None, None
    
import re  # Add this at the top of your file with other imports

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

    try:
        # Process each course
        for course_codes, term_sections in courses_data.items():
            # Process each term for the current course
            for term, sections in term_sections.items():
                print(f"  Processing term: {term}")
                
                # Process each section in the term
                for section_info in sections:
                    # Clean and truncate section data
                    offered_term = term[:20] if term else ''  # VARCHAR(20)
                    section_name = section_info.get('section_name', '')[:20]
                    seats_info = section_info.get('seats', '0/0')[:20]
                    course_code = section_info.get('course_code', 'Unknown')[:20]
                    instructors = ', '.join(section_info.get('instructors', ['Unknown']))[:50]
                    course_type = section_info.get('course_type', 'Unknown')[:20]
                    section_number = section_info.get('section_number', '')[:20]
                    credits = section_info.get('credits')  # Assuming credits is an integer
                    # Insert section into database
                    insert_section_query = """
                        INSERT INTO courses 
                        (offered_term, section_name, seats, instructor, course_type, course_code, section_number,credits)
                        VALUES (%s, %s, %s, %s, %s, %s, %s,%s)
                    """
                    params = (
                        offered_term,
                        section_name,
                        seats_info,
                        instructors,
                        course_type,
                        course_code,  
                        section_number,
                        credits
                    )
                    db_cursor.execute(insert_section_query, params)
                    course_id = db_cursor.lastrowid

                    # Process meeting details
                    for meeting_detail in section_info.get('meeting_details', []):
                        # Extract and clean times
                        times = meeting_detail.get('times', [])
                        # print(f"raw timings: {times}")
                        
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
        print("Successfully inserted all sections and events")

    except Exception as e:
        print(f"An error occurred while adding data to the database: {e}")
        db_connection.rollback()

    finally:
        db_cursor.close()
        db_connection.close()

def batch_insert_events(events_list, course_id):
    """
    Insert multiple events into the course_events table in one batch operation.
    """
    db_connection, db_cursor = get_db_connection()
    query = """
        INSERT INTO course_events (
            course_id, event_type, event_date, start_date, end_date, days, time, location, description, weightage
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Prepare the data for batch insertion
    batch_data = [
        (
            course_id,
            event.get('event_type'),
            event.get('date'),
            event.get('start_date'),
            event.get('end_date'),
            # event.get('days'),
            ','.join(event.get('days', [])),
            event.get('time'),
            event.get('location'),
            event.get('description'),
            event.get('weightage')
        )
        for event in events_list
    ]

    try:
        # Use executemany for batch insertion
        db_cursor.executemany(query, batch_data)
        db_connection.commit()
        print(f"Inserted {db_cursor.rowcount} events for course ID {course_id}.")
    except Exception as e:
        print(f"An error occurred while inserting events: {e}")
        db_connection.rollback()
    finally:
        db_cursor.close()
        db_connection.close()

def get_section_details(school_code, course_code, section_number):
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
            SELECT c.course_id, e.event_type, e.times, e.location
            FROM events e
            JOIN courses c ON e.course_id = c.course_id
            WHERE c.section_name = %s
        """
        db_cursor.execute(query, (full_section_code,))
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
                'location': result_row[3]
            })

        return section_details
    except Exception as e:
        print(f"Database error: {e}")
        return {'course_id': None, 'section_details': []}
    finally:
        db_cursor.close()
        db_connection.close()
