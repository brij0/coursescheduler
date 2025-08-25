import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coursescheduler.settings')
import django
django.setup()
import logging
logger = logging.getLogger(__name__)
import time
from seleniumbase import SB
from bs4 import BeautifulSoup
from database import *
import re
import json
from scheduler.models import Course
def init_selenium_driver():
    """
    Initialize the SeleniumBase driver with specific settings.
    
    Returns:
        SB: An instance of SeleniumBase driver.
    """
    return SB(uc=True, browser="Chrome", incognito=True)

def get_total_pages(page_source):
    """
    Extract the total number of pages from the page source.
    
    Args:
        page_source (str): The HTML content of the page.
    
    Returns:
        int: The total number of pages.
    """
    soup = BeautifulSoup(page_source, 'html.parser')
    pagination = soup.find('span', id='course-results-total-pages')
    try:
        total_pages_text = pagination.get_text(strip=True)
        return int(total_pages_text) if total_pages_text else 1
    except:
        return 1

def extract_course_list(page_source):
    soup = BeautifulSoup(page_source, 'html.parser')
    list_of_courses = []
    h3_for_courses = soup.find_all('h3', class_='esg-col-xxs-12 esg-col-xs-7 esg-col-md-8')
    for h3_course in h3_for_courses:
        course_text = h3_course.find('span').get_text(strip=True)
        course = course_text.split(' ')[0]  # Extract the course code part
        course_code = int(course.split('*')[-1])
        if course_code < 5000:  #Only want Undergraduate courses (making an assumption that UG courses have course_code < 5000)
            list_of_courses.append(course)
        else:
            continue
    return list_of_courses

def get_missing_courses(course_codes):
    missing = []
    for code in course_codes:
        exists = Course.objects.filter(section_name__startswith=code).exists()
        if not exists:
            missing.append(code)

    return missing

def extract_course_sections(course_html):
    """
    Extract relevant course details from HTML content, grouped by term.
    
    Args:
        course_html (str): The HTML content of the course page.
    
    Returns:
        dict: A dictionary with terms as keys and lists of section dictionaries as values.
    """
    soup = BeautifulSoup(course_html, 'html.parser')
    span = soup.find('span', attrs={'data-bind': re.compile(r'course-\$data\.Id\(\)')})
    if not span:
        span = soup.find('span', id=re.compile(r'^course-\d+'))
    if span:
        text = span.get_text(strip=True)
        match = re.search(r'\(([\d.]+)\s*Credits?\)', text)
        if match:
            credits = match.group(1)
        else:
            credits = '0.5'  # Default if not found
    else:
        credits = '0.5'  # Default if not found
    all_elements = soup.find_all(['h4', 'table'])
    
    all_sections = {}
    current_term = None
    
    for element in all_elements:
        # Check if this is a term header
        if element.name == 'h4' and element.get('data-bind') == 'text: $data.Term.Description()':
            current_term = element.get_text(strip=True)
            all_sections[current_term] = []
            continue
        
        # Check if this is a course section table
        if (element.name == 'table' and current_term is not None):
            classes = element.get('class', [])
            if ('esg-table' in classes and 'esg-table--no-mobile' in classes and 
                'esg-section--margin-bottom' in classes and 'search-sectiontable' in classes):
                section_info = {}
                section_info['term'] = current_term  
                
                caption = element.find('caption', class_='offScreen')
                if caption:
                    section_info['section_name'] = caption.get_text(strip=True)
                    section_info['course_type'] = caption.get_text(strip=True).split("*")[0]
                    section_info['course_code'] = caption.get_text(strip=True).split("*")[1]
                    section_info['section_number'] = caption.get_text(strip=True).split("*")[-1]
                
                seats_td = element.find('td', class_='search-seatscell')
                if seats_td:
                    seat_info = seats_td.find('span', class_='search-seatsavailabletext')
                    section_info['seats'] = seat_info.get_text(strip=True) if seat_info else 'Unavailable'

                rows = element.find_all('tr', class_='search-sectionrow')
                meeting_details = []

                for row in rows:
                    meeting_info = {}
                    time_td = row.find('td', class_='search-sectiondaystime')
                    if time_td:
                        time_divs = time_td.find_all('div')
                        meeting_info['times'] = [time_div.get_text(strip=True) for time_div in time_divs]
                    
                    location_td = row.find('td', class_='search-sectionlocations')
                    if location_td:
                        location_divs = location_td.find_all('div')
                        meeting_info['locations'] = [location_div.get_text(strip=True) for location_div in location_divs]

                        event_type = location_td.find('span', class_='search-meetingtimestext', id=lambda x: x and 'meeting-instructional-method' in x)
                        meeting_info['event_type'] = event_type.get_text(strip=True) if event_type else 'Unknown'

                    meeting_details.append(meeting_info)

                instructor_td = element.find('td', class_='search-sectioninstructormethods')
                instructors = []
                if instructor_td:
                    instructor_spans = instructor_td.find_all('span')
                    for instructor_span in instructor_spans:
                        instructors.append(instructor_span.get_text(strip=True))

                section_info['meeting_details'] = meeting_details
                section_info['instructors'] = instructors
                section_info['credits'] = credits  # Add credits information
                all_sections[current_term].append(section_info)
    return all_sections

def scrape_courses(list_of_course_types):
    """
    Scrape multiple courses and return their section information.
    """
    total_start_time = time.perf_counter()
    scraping_stats = {}
    
    for course_type in list_of_course_types:
        course_type_start_time = time.perf_counter()
        all_scraped_courses = {}
        courses_scraped = 0
        base_url = 'https://colleague-ss.uoguelph.ca/Student/Courses/Search?keyword={}'
        
        logger.info(f"Starting scrape for course type: {course_type}")
        
        try:
            with SB(browser="chrome") as sb:
                url = base_url.format(course_type)
                sb.open(url)
                sb.wait(3)
                total_pages = get_total_pages(sb.get_page_source())
                logger.info(f"Found {total_pages} pages for {course_type}")
                
                for page in range(1, total_pages + 1):
                    sb.type('input[id="course-results-current-page"]', str(page))
                    sb.wait(2)
                    page_start_time = time.perf_counter()
                    page_scraped_courses = {}
                    try:
                        page_source = sb.get_page_source()
                        list_of_courses = extract_course_list(page_source)
                        list_of_missing_courses = get_missing_courses(list_of_courses)
                        
                        logger.info(f"Page {page}/{total_pages} for {course_type}: Found {list_of_missing_courses} courses to scrape")
                        
                        for course in list_of_missing_courses:
                            course_start_time = time.perf_counter()
                            try:
                                button_selector = f'button[aria-controls="collapsible-view-available-sections-for-{course}-collapseBody"]'
                                if button_selector:
                                    sb.click(button_selector, delay=0.01)
                                    # Changing wait time from hard coded sb.wait(10) to wait for table to load improved 
                                    # performance 5x (previously avg 14s per course now 3s per course) and with hard coded time
                                    # we missed the courses where it took longer then 10 seconds to load.
                                    sb.wait_for_element('h4[data-bind="text: $data.Term.Description()"]', timeout=60)
                                    page_source = sb.get_page_source()
                                    page_scraped_courses[course] = extract_course_sections(page_source)
                                    courses_scraped += 1
                                    sb.refresh_page()
                                    sb.wait(2)
                                    sb.type('input[id="course-results-current-page"]', str(page))
                                    course_duration = time.perf_counter() - course_start_time
                                    logger.info(f"Scraped course {course} in {course_duration:.2f}s", 
                                             extra={"course": course, "duration": course_duration})
                                else:
                                    continue
                            except Exception as e:
                                logger.error(f"Error scraping course {course}", extra={"error": str(e), "course": course})
                                continue
                    
                        page_duration = time.perf_counter() - page_start_time
                        logger.info(f"Completed page {page}/{total_pages} for {course_type} in {page_duration:.2f}s", 
                                 extra={"page": page, "total_pages": total_pages, "course_type": course_type, "duration": page_duration})
                        
                    except Exception as e:
                        logger.error(f"Error processing page {page} for {course_type}", extra={"error": str(e)})
                        continue
                    insert_cleaned_sections(page_scraped_courses)
                    all_scraped_courses.update(page_scraped_courses)
                    next_page = page + 1
                    sb.type('input[id="course-results-current-page"]', str(next_page))
                    sb.wait(1)
            course_type_duration = time.perf_counter() - course_type_start_time
            avg_time_per_course = course_type_duration / courses_scraped if courses_scraped > 0 else 0
            
            scraping_stats[course_type] = {
                "total_courses": courses_scraped,
                "total_duration": course_type_duration,
                "avg_time_per_course": avg_time_per_course
            }
            
            logger.info(f"Completed scraping {course_type}: {courses_scraped} courses in {course_type_duration:.2f}s (avg: {avg_time_per_course:.2f}s per course)",
                     extra={"course_type": course_type, 
                            "courses_scraped": courses_scraped, 
                            "duration": course_type_duration,
                            "avg_time_per_course": avg_time_per_course})
            
        except Exception as e:
            logger.error(f"Fatal error scraping course type {course_type}", extra={"error": str(e)})
    
    total_duration = time.perf_counter() - total_start_time
    total_courses = sum(stats["total_courses"] for stats in scraping_stats.values())
    avg_time_overall = total_duration / total_courses if total_courses > 0 else 0
    
    logger.info(f"Completed scraping all course types: {total_courses} courses in {total_duration:.2f}s (avg: {avg_time_overall:.2f}s per course)",
             extra={"total_courses": total_courses, 
                    "total_duration": total_duration,
                    "avg_time_per_course": avg_time_overall,
                    "stats_by_course_type": scraping_stats})
    
    return True
if __name__ == '__main__':
    course_types = ['ENGG']
    # course_types = ['ENGG','MATH','BIOL','CHEM','PHYS','ECON','SOCI','ANTH','GEOG','PHIL','COMM','NUTR','FDSC','STAT','CPSC']
    scraped = scrape_courses(course_types)