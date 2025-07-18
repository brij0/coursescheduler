from calendar import c
from datetime import datetime
from math import e
from langchain_groq import ChatGroq
import fitz
import os
from dotenv import load_dotenv
import re
from datetime import datetime
import pdfplumber
from numpy import add
from sqlalchemy import LABEL_STYLE_DEFAULT
from scrape_course import *
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["REQUESTS_CA_BUNDLE"] = ""
import ssl
ssl._create_default_https_context = ssl._create_unverified_context
# ...rest of your code...
import httpx
httpx._config.DEFAULT_CA_BUNDLE_PATH = None
# ---------------------------------------------------------
# Load API key and setup LLM for content processing
# ---------------------------------------------------------
def invoke_language_model(content):
    # Load environment variables for API key
    load_dotenv()

    # Initialize the LLM (LLaMA 3.2 model)
    llm = ChatGroq(
        temperature=0,
        groq_api_key=os.getenv('GROQ_API_KEY1'),  # API key loaded from environment variable
        model_name="deepseek-r1-distill-llama-70b"
    )
    
    # Send content to the LLM for processing and return the response
    response = llm.invoke(content)
    return response.content

# ---------------------------------------------------------
# Clean up text from PDF by ensuring proper encoding
# ---------------------------------------------------------
def sanitize_pdf_text(text):
    # Ensure the text is encoded in UTF-8 and decoded back to a string
    encoded_text = text.encode('utf-8', errors='ignore')
    utf8_text = encoded_text.decode('utf-8', errors='ignore')

    # Optionally replace ligatures or unsupported characters
    utf8_text = utf8_text.replace("\ufb01", "fi").replace("\ufb02", "fl")

    # Clean up the text by removing excessive newlines and spaces
    cleaned_text = utf8_text.replace('\n', ' ').replace('\r', '').strip()

    return cleaned_text

# ---------------------------------------------------------
# Extract text from PDF and clean it
# ---------------------------------------------------------
def extract_and_sanitize_pdf_text(pdf_path):
    # Open the PDF file
    doc = fitz.open(pdf_path)
    text = ""
    
    # Loop through each page to extract the text
    for page_num in range(doc.page_count - 2):
        page = doc.load_page(page_num)
        text += page.get_text("text")  # Extract text from the page
    
    # Clean up the extracted PDF content
    cleaned_pdf_content = sanitize_pdf_text(text)
    return cleaned_pdf_content


# ---------------------------------------------------------
# LLM prompt to extract events from the course outline
# ---------------------------------------------------------
def create_llm_prompt(course_details, student_details):
    details = student_details.get('section_details')  # Extract section details
    
    # Initialize dictionaries for different event types
    lec_details = {
        "My_Lecture_timings_are": "",
        "Location": "",
        "days" : ""
    }
    lab_details = {
        "My_Lab_timings_are": "",
        "Location": "",
        "days" : ""
    }
    final_exam_details = {
        "My_Final_Exam_timings_are": "",
        "Location": "",
        "days" : ""
    }
    seminar_details = {
        "My_Seminar_timings_are": "",
        "Location": "",
        "days" : ""
    }
    
    # Extract details from student_details
    for event in details:
        event_type = event.get('event_type')
        if event_type == 'LEC':
            lec_details["My_Lecture_timings_are"] = event.get('times', '')
            lec_details["Location"] = event.get('location', '')
            lec_details["days"] = event.get('days', '')
        elif event_type == 'LAB':
            lab_details["My_Lab_timings_are"] = event.get('times', '')
            lab_details["Location"] = event.get('location', '')
            lab_details["days"] = event.get('days', '')
        elif event_type in ['EXAM', 'FINAL EXAM']:
            final_exam_details["My_Final_Exam_timings_are"] = event.get('times', '')
            final_exam_details["Location"] = event.get('location', '')
            final_exam_details["days"] = event.get('days', '')
        elif event_type == 'SEM':
            seminar_details["My_Seminar_timings_are"] = event.get('times', '')
            seminar_details["Location"] = event.get('location', '')
            seminar_details["days"] = event.get('days', '')

    # Use f-strings for proper string interpolation
        prompt_template = f"""You are tasked with extracting **academic events** from a course outline with 100% accuracy. Your output will be used for automated GPA calculations and must follow the structure and rules below:

        CONTEXT:
        Student's Schedule:
        - Lectures: {lec_details['My_Lecture_timings_are']} {lec_details['Location']} {lec_details['days']}
        - Labs: {lab_details['My_Lab_timings_are']} {lab_details['Location']} {lab_details['days']}
        - Seminar: {seminar_details['My_Seminar_timings_are']}  {seminar_details['Location']} {seminar_details['days']}
        - Final Exam: {final_exam_details['My_Final_Exam_timings_are']} {final_exam_details['Location']} {final_exam_details['days']}

        REQUIRED EVENTS TO EXTRACT:
        1. All assignments/projects with explicit due dates
        2. All lab sessions mentioned in the course outline
        3. All midterm examinations
        4. Final examination
        5. Any recurring weekly quizzes (only **graded** ones)
        6. Notes about grading rules (e.g., "best 4 out of 5 quizzes count")

        OUTPUT FORMAT [STRICT]:
        Return a list of **individual events** with this structure for each:

        Event Type: [Lab|Midterm|Final|Assignment|Quiz|Seminar|Other]
        Date: [YYYY-MM-DD]
        Days: [Matching day of week]
        Time: [HH:MM] (24-hour format)
        Location: [Building,Room]
        Description: [Short summary of the event]
        Weightage: [JSON like 'Scheme 1': 30, 'Scheme 2': 25] ← always use JSON format, even if only one scheme applies
        Grading Note: [Optional notes like "Only best 4 of 5 quizzes will be counted"]

        RULES:
        1. Extract ONLY events with explicit due dates
        2. Weightages MUST be present and formatted as JSON — e.g., 'Scheme 1': 20 or 'Scheme 1': 20, 'Scheme 2': 25
        3. DO NOT include holidays or makeup sessions
        4. For labs, match the student's schedule exactly (day/time/location)
        5. If quizzes/assignments/labs state "only best X of Y" will be counted, include only the best X events and add a "Grading Note"
        6. If multiple grading schemes exist, include all applicable schemes in JSON format under “Weightage”
        7. All extracted events MUST total to 100% per scheme — apply math carefully

        WEIGHTAGE RULES:
        1. NEVER duplicate category weightage across all events (e.g., don't assign “Labs: 25%” to each lab)
        2. If “Labs: 25%” and there are 10 lab sessions, each lab = 2.5%
        3. If “Quizzes: 15%” and 5 quizzes but only best 4 count, include only 4 events and each = 3.75%
        4. Always distribute weightage **only across counted events**
        5. If events have individual weightages (e.g., “Assignment 1: 5%”), preserve those exactly

        GRADE EXTRACTION STRATEGY:
        1. Search for terms like “grade breakdown”, “evaluation scheme”, “weighted”, “assessment”, “worth”
        2. Parse both category totals and individual breakdowns
        3. Capture alternate grading schemes wherever mentioned (e.g., “Option A: no final exam, Option B: with final exam”)
        4. Preserve all grading schemes using this JSON format for each event:
        "'Scheme 1': X%, 'Scheme 2': Y%, ..."

        FORBIDDEN:
        - DO NOT assign total category weightage to each sub-event
        - DO NOT create duplicate entries for schemes
        - DO NOT let total exceed 100% for any scheme

        Course Outline:
        {course_details}
        """

    print(prompt_template.format(course_details=course_details, details = details, lec_details=lec_details, lab_details=lab_details, final_exam_details=final_exam_details))
    # return None
    return invoke_language_model(prompt_template)

# ---------------------------------------------------------
# Extract details from an individual event string
# ---------------------------------------------------------
def parse_event_details(event_str):
    event = {}

    # Extract Event Type
    event_type_match = re.search(r"Event Type: (.+)", event_str)
    if event_type_match:
        event['event_type'] = event_type_match.group(1)

    # Extract Date (handles both date ranges and single dates, ignoring 'TBA')
    date_match = re.search(r"Date: (.+)", event_str)
    if date_match:
        date_range = date_match.group(1).split(' - ')
        if len(date_range) > 1:
            event['start_date'] = date_range[0] if date_range[0] != 'TBA' else 'TBA'
            event['end_date'] = date_range[1] if date_range[1] != 'TBA' else 'TBA'
        else:
            event['date'] = date_range[0] if date_range[0] != 'TBA' else 'TBA'

    # Extract Days
    days_match = re.search(r"Days: (.+)", event_str)
    if days_match:
        event['days'] = days_match.group(1).split(', ')

    # Extract Time
    time_match = re.search(r"Time: (.+)", event_str)
    if time_match:
        event['time'] = time_match.group(1)

    # Extract Location
    location_match = re.search(r"Location: (.+)", event_str)
    if location_match:
        event['location'] = location_match.group(1)

    # Extract Description
    description_match = re.search(r"Description: (.+)", event_str)
    if description_match:
        event['description'] = description_match.group(1)

    # Extract Weightage
    weightage_match = re.search(r"Weightage: (.+)", event_str)
    if weightage_match:
        event['weightage'] = weightage_match.group(1)
    
    return event

# ---------------------------------------------------------
# Parse the LLM response to extract multiple events
# ---------------------------------------------------------
def parse_all_event_details(events_str):
    # Split the input string by two newlines to separate events
    event_blocks = events_str.strip().split('\n\n')

    # Initialize a list to store all parsed events
    events = []

    # Loop through each event block and parse it
    for event_block in event_blocks:
        event = parse_event_details(event_block)
        events.append(event)

    return events

# ---------------------------------------------------------
# Helper function to parse date and time strings
# ---------------------------------------------------------
def convert_date_and_time(date_str, time_str):
    try:
        if date_str != 'TBA' and time_str != 'N/A':
            start_time_str, end_time_str = time_str.split(' - ')
            start_time = datetime.strptime(date_str + ' ' + start_time_str.strip(), "%Y-%m-%d %I:%M %p")
            end_time = datetime.strptime(date_str + ' ' + end_time_str.strip(), "%Y-%m-%d %I:%M %p")
            return start_time, end_time
        else:
            return None, None
    except Exception as e:
        print(f"Error parsing date/time: {str(e)}")
        return None, None

# ---------------------------------------------------------
# Main function to extract, parse, and format events
# ---------------------------------------------------------
def process_pdfs_to_event_list(pdf_input, student_details):
    # Extract the content from the PDF
    pdf_content = extract_and_sanitize_pdf_text(pdf_input)

    # Send the extracted content to the LLM template to process and return structured event data
    llm_chained_template_response = create_llm_prompt(pdf_content, student_details)

    # Parse the structured response and extract all events
    event_list = parse_all_event_details(llm_chained_template_response)

    return event_list
# ---------------------------------------------------------
# Main function to execute the process
# ---------------------------------------------------------

if __name__ == "__main__":  
    course_listt = [
            {"course_type": "CHEM", "course_code": "2700", "course_section": "0101","offered_term":"Summer 2025"}
            ]
    for course in course_listt:
        course_type = course.get("course_type")
        course_code = course.get("course_code")
        course_section = course.get("course_section")
        offered_term = course.get("offered_term")
        student_details = get_section_details(course_type, course_code, course_section,offered_term)
        # print(f"Student details: {student_details}")
        events = process_pdfs_to_event_list(f"C:/Users/brijesh.thakrar/Downloads/coursescheduler-backendtesting/coursescheduler/backend/course_outlines/chem_2700_S25.pdf", student_details)
        # print(f"Events for {course_type} {course_code} {course_section}:")
        
        # for event in events:
            # print(event)
        # event_list = [
        # ]
        # for event in events:
        #     if event != {} and len(event['date']) <15 and len(event['weightage']) < 8:
        #         event_list.append(event)
        #         print(event)
        # batch_insert_events(event_list, student_details['course_id'])