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
# from sqlalchemy import LABEL_STYLE_DEFAULT
from scrape_course import *
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
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
        model_name="moonshotai/kimi-k2-instruct"
    )
    
    # Send content to the LLM for processing and return the response
    response = llm.invoke(content)
    # print(f"LLM Response: {response.content}")  # Debugging output to see the response content
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
    if doc.page_count >8:
        page_range = doc.page_count - 2  # Exclude the last 2 pages
    else:
        page_range = doc.page_count
    for page_num in range(page_range):
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
        "days" : "",
        "dates": ""
    }
    lab_details = {
        "My_Lab_timings_are": "",
        "Location": "",
        "days" : "",
        "dates": ""
    }
    final_exam_details = {
        "My_Final_Exam_timings_are": "",
        "Location": "",
        "days" : "",
        "dates": ""
    }
    seminar_details = {
        "My_Seminar_timings_are": "",
        "Location": "",
        "days" : "",
        "dates": ""
    }
    
    # Extract details from student_details
    for event in details:
        event_type = event.get('event_type')
        if event_type == 'LEC':
            lec_details["My_Lecture_timings_are"] = event.get('times', '')
            lec_details["Location"] = event.get('location', '')
            lec_details["days"] = event.get('days', '')
            lec_details["dates"] = event.get('dates', '')
        elif event_type == 'LAB':
            lab_details["My_Lab_timings_are"] = event.get('times', '')
            lab_details["Location"] = event.get('location', '')
            lab_details["days"] = event.get('days', ''),
            lab_details["dates"] = event.get('dates', '')
        elif event_type in ['EXAM', 'FINAL EXAM']:
            final_exam_details["My_Final_Exam_timings_are"] = event.get('times', '')
            final_exam_details["Location"] = event.get('location', '')
            final_exam_details["days"] = event.get('days', ''),
            final_exam_details["dates"] = event.get('dates', '')
        elif event_type == 'SEM':
            seminar_details["My_Seminar_timings_are"] = event.get('times', '')
            seminar_details["Location"] = event.get('location', '')
            seminar_details["days"] = event.get('days', ''),
            seminar_details["dates"] = event.get('dates', '')

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

        Example Output:
        Return a JSON array where each item is a dictionary with the following keys:
        "
        "event_type": "Assignment-1",
        "date": "2025-06-04",
        "days": "Wednesday",
        "time": "23:59",
        "location": "Online (CourseLink)",
        "description": "Written Assignment 1 submission",
        "weightage": "
            "Scheme 1": 10,
            "Scheme 2": 10,
            "Scheme 3": 10
        ,
        "grading_note": "Part of the 30% assignments in all schemes"
        "
        RULES:
        All events must have a descriptive name and if multiple events of same type then differentiate them (e.g., "Assignment-1", "Assignment-2")
        1. Extract ONLY events with explicit due dates
        2. Weightages MUST be present and formatted as JSON — e.g., 'Scheme 1': 20 or 'Scheme 1': 20, 'Scheme 2': 25
        3. DO NOT include holidays or makeup sessions
        4. For labs, match the student's schedule exactly (day/time/location)
        5. If quizzes/assignments/labs state "only best X of Y" will be counted, include only the best X events and add a "Grading Note"
        6. If multiple grading schemes exist, include all applicable schemes in JSON format under “Weightage”
        7. All extracted events MUST total to 100% per scheme — apply math carefully
        

        WEIGHTAGE RULES:
        1. NEVER duplicate category weightage across all events (e.g., don't assign “Labs: 25%” to each lab)
        2. If “Labs: 25%” and 12 sessions exist but only best 10 count, extract **only 10 labs** and assign 2.5% to each (25 ÷ 10)
        3. If “Quizzes: 15%” and 5 quizzes but only best 4 count, include only 4 events and each = 3.75%
        4. Always distribute weightage **only across counted events** — never divide by total possible events
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
        - EACH event must have a date and time, if not mentioned then give a logical date and time
        - The total weightage across all events must equal 100% for each grading scheme
        Course Outline:
        {course_details}
        """

    # print(prompt_template.format(course_details=course_details, details = details, lec_details=lec_details, lab_details=lab_details, final_exam_details=final_exam_details))
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
    """
    Parse the LLM response, which may contain a JSON array of events or plain text.
    Returns a list of event dictionaries.
    """
    # Try to extract JSON array from the response
    json_match = re.search(r"```(?:json)?\s*(\[[\s\S]+?\])\s*```", events_str)
    if not json_match:
        # Try to find a JSON array without code block markers
        json_match = re.search(r"(\[[\s\S]+?\])", events_str)
    if json_match:
        try:
            events = json.loads(json_match.group(1))
            # Normalize weightage field for each event
            for event in events:
                if "weightage" in event:
                    if isinstance(event["weightage"], dict):
                        # Already a dict, nothing to do
                        pass
                    elif isinstance(event["weightage"], str):
                        # Try to parse as JSON/dict-like string
                        try:
                            event["weightage"] = json.loads(event["weightage"].replace("'", '"'))
                        except Exception:
                            # Fallback: wrap as single scheme
                            event["weightage"] = {"Scheme 1": event["weightage"]}
                else:
                    event["weightage"] = {}
            return events
        except Exception as e:
            print(f"Error parsing JSON events: {e}")
            return []
    else:
        # Fallback: use old line-by-line parser
        event_blocks = events_str.strip().split('\n\n')
        events = []
        for event_block in event_blocks:
            event = parse_event_details(event_block)
            if event:
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
            {"course_type": "MGMT", "course_code": "3140", "course_section": "01","offered_term":"Summer 2025"}
            ]
    for course in course_listt:
        course_type = course.get("course_type")
        course_code = course.get("course_code")
        course_section = course.get("course_section")
        offered_term = course.get("offered_term")
        student_details = get_section_details(course_type, course_code, course_section,offered_term)
        events = process_pdfs_to_event_list(f"./course_outlines/mgmt_3140_S25.pdf", student_details)
        event_list =[]

        for event in events:
            event_list.append(event)

        print(f"Event list: {event_list}")
        # batch_insert_events_with_schemes(event_list, student_details['course_id'])