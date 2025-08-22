import os
import logging
logger = logging.getLogger(__name__)
import time
from seleniumbase import SB
from bs4 import BeautifulSoup
import re
import json


def scrape_course_availability_links(url):
    base_domain = 'https://calendar.uoguelph.ca/'
    with SB(browser="chrome") as sb:
        sb.open(url)
        sb.wait(1)
        page_source= sb.get_page_source()
        soup = BeautifulSoup(page_source, 'html.parser')
        course_links = []
        site_map = soup.find('div', class_='az_sitemap')
        if not site_map:
            logger.error("Site map not found on the page.")
            return None
        for uls in site_map.find_all('ul'):
            for link in uls.find_all('a', href=True):
                link_text = link.get('href')
                if not '#' in link_text :
                    course_links.append(base_domain + link.get('href'))
                else:
                    logger.warning(f"Skipping link with fragment: {link_text}")
        course_links = list(set(course_links))
    with open('course_availability_links.json', 'w') as f:
        json.dump(course_links, f, indent=4)
    return course_links

def scrape_course_availability(url):
    try:
        with open ('course_availability_links.json', 'r') as f:
            course_links = json.load(f)
    except FileNotFoundError:
            logger.info("No course links found in the JSON file, scraping again.")
            course_links = scrape_course_availability_links(url)
    
    with SB(browser="chrome") as sb:
        course_details_list = []
        for link in course_links:
            sb.open(link)
            sb.wait(1)
            page_source = sb.get_page_source()
            soup = BeautifulSoup(page_source, 'html.parser')
            # CHANGE 1: Find all course blocks on the page
            course_boxes = soup.find_all('div', class_='courseblock')
            # Store course details in a structured format
            
            for course_box in course_boxes:
                course_details = {}
                
                header_div = course_box.find('div', class_='cols noindent')
                if not header_div:
                    continue
                # Extract course details from each course box header
                try:
                    course_code = header_div.find('span', class_='text detail-code margin--small text--semibold text--big').get_text(strip=True)
                    course_title = header_div.find('span', class_='text detail-title margin--small text--semibold text--big').get_text(strip=True)
                    offered_terms = header_div.find('span', class_='text detail-typically_offered margin--small text--semibold text--big').get_text(strip=True)
                    credits = header_div.find('span', class_='text detail-hours_html margin--small text--semibold text--big').get_text(strip=True)
                except AttributeError as e:
                    logger.warning(f"Error extracting basic course details: {e}")
                    continue
                
                # Initialize variables with default values
                course_description = ""
                course_offerings = ""
                course_prerequisites = ""
                course_restrictions = ""
                
                desc_elem = course_box.find('div', class_='courseblockextra noindent')
                if desc_elem:
                    course_description = desc_elem.get_text(strip=True)
                
                # Look for other details in spans with specific classes
                offerings_elem = course_box.find('span', class_='text detail-offering margin--default')
                if offerings_elem:
                    offerings_span = offerings_elem.find('span')
                    if offerings_span:
                        course_offerings = offerings_span.get_text(strip=True)
                
                prereq_elem = course_box.find('span', class_='text detail-prerequisite_s_ margin--default')
                if prereq_elem:
                    prereq_span = prereq_elem.find('span')
                    if prereq_span:
                        course_prerequisites = prereq_span.get_text(strip=True)
                
                restrict_elem = course_box.find('span', class_='text detail-restriction margin--default')
                if restrict_elem:
                    restrict_span = restrict_elem.find('span')
                    if restrict_span:
                        course_restrictions = restrict_span.get_text(strip=True)
                
                # Store the extracted details in a dictionary
                course_details['course_code'] = course_code
                course_details['course_title'] = course_title
                course_details['offered_terms'] = offered_terms 
                course_details['credits'] = credits
                course_details['course_description'] = course_description
                course_details['course_offerings'] = course_offerings
                course_details['course_prerequisites'] = course_prerequisites
                course_details['course_restrictions'] = course_restrictions
                course_details_list.append(course_details)
        # Save the course details to a JSON file
        with open('course_details.json', 'w') as f:
            json.dump(course_details_list, f, indent=4)
    return course_links

if __name__ == "__main__":
    url = 'https://calendar.uoguelph.ca/undergraduate-calendar/course-descriptions/'

    course_links = scrape_course_availability(url)