import os
import logging
logger = logging.getLogger(__name__)
import time
from seleniumbase import SB
from bs4 import BeautifulSoup
import re
import json


def scrape_major_links(url):
    """
    Scrape major requirements from the https://calendar.uoguelph.ca/undergraduate-calendar/programs-majors-minors/
    """
    base_url = url
    major_urls = []
    try:
        with SB(browser="chrome") as sb:
            sb.open(base_url)
            sb.wait(1)
            page_source = sb.get_page_source()
            soup = BeautifulSoup(page_source, "html.parser")
            # Find all links to majors
            site_map = soup.find("div", class_="sitemap")
            if site_map:
                links = site_map.find_all("a")
                for link in links:
                    href = link.get("href")
                    if href:
                        domain= "https://calendar.uoguelph.ca"
                        full_url = domain + href if not href.startswith("http") else href
                        major_urls.append(full_url)
            else:
                logger.error("Site map not found on the page.")
                return None
            major_urls = list(set(major_urls))
    except Exception as e:
        logger.error(f"Failed to open URL {url}: {e}")
        return None
    with open("major_links.json", "w") as f:
        json.dump(major_urls, f, indent=4)
    return major_urls

def scrape_major_links_with_breakdown(url):
    """
    Scrape major requirements from the given URL.
    """
    with open("major_links.json", "r") as f:
        major_links = json.load(f)
    if not major_links:
        major_links = scrape_major_links(url)
        logger.error("No major links found.")
    with SB(browser="chrome") as sb:
        sb.open(url)
        offerings_list = []
        for major_url in major_links:
            try:
                sb.open_new_window()
                sb.get(major_url)
                sb.wait(1)
                source = sb.get_page_source()
                soup = BeautifulSoup(source, "html.parser")
                offerings= soup.find("nav", id = "tabs")
                offering_links = offerings.find_all("li", role = "presentation")
                for offering in offering_links:
                    offering_text = offering.get_text(strip=True)
                    if "Major" in offering_text or "Co-op" in offering_text:
                        link = offering.find("a")
                        if link:
                            full_offering_url = major_url + link.get("href")
                            offerings_list.append(full_offering_url)
                    else:
                        continue
            except Exception as e:
                logger.error(f"Failed to open major URL {major_url}: {e}")
                continue
        with open("major_links_breakdown.json", "w") as f:
                json.dump(offerings_list, f, indent=4)
        return offerings_list
    
def find_table_by_header(soup, header_text):
    """
    Find a table that follows an h3 header containing the specified text.
    
    Args:
        soup: BeautifulSoup object
        header_text: Text to search for in h3 headers
    
    Returns:
        The table element following the matching header, or None if not found
    """
    # Find all h3 elements
    headers = soup.find_all("h3")
    
    for header in headers:
        # Check if this header contains our target text
        if header_text.lower() in header.get_text().lower():
            # Find the next table after this header
            table = header.find_next("table", class_="sc_courselist")
            if table:
                return table
    return None

def find_program_sequence_table(soup):
    """
    Find the program sequence table by first looking for a header, 
    then checking for tables that contain semester information.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        The program sequence table, or None if not found
    """
    # First try to find by header
    table = find_table_by_header(soup, "Recommended Program Sequence")
    if table:
        return table
    
    # If not found, look for tables with semester information
    tables = soup.find_all("table", class_="sc_courselist")
    for table in tables:
        # Look for semester headers in the table rows
        semester_spans = table.find_all("span", class_="courselistcomment areaheader")
        for span in semester_spans:
            if "semester" in span.get_text().lower():
                return table
    return None

def parse_program_sequence(program_sequence_table):
    """
    Parse the program sequence table into a structured dictionary by semester.
    """
    result = {}
    current_semester = None
    semester_counters = {}  # Track counts of each semester name
    
    if not program_sequence_table:
        return result
    
    rows = program_sequence_table.find_all("tr")
    
    for row in rows:
        # Check if this is a semester header row
        header_span = row.find("span", class_="courselistcomment areaheader")
        if header_span:
            semester_name = header_span.get_text(strip=True)
            
            # Handle duplicate semester names by adding a counter
            if semester_name in semester_counters:
                semester_counters[semester_name] += 1
                current_semester = f"{semester_name} ({semester_counters[semester_name]})"
            else:
                semester_counters[semester_name] = 1
                current_semester = semester_name
                
            result[current_semester] = []
            continue
        
        # If we haven't found a semester header yet, skip
        if not current_semester:
            continue
        
        # Process course or elective row
        course_code_cell = row.find("td", class_="codecol")
        hours_cell = row.find("td", class_="hourscol")
        
        # Only process rows with credit hours
        if hours_cell and hours_cell.get_text(strip=True):
            credits = hours_cell.get_text(strip=True)
            
            # Regular course with code
            if course_code_cell and course_code_cell.find("a"):
                course_code = course_code_cell.find("a").get_text(strip=True)
                result[current_semester].append({course_code: credits})
            
            # Elective or other requirement
            else:
                comment_span = row.find("span", class_="courselistcomment")
                if comment_span:
                    requirement = comment_span.get_text(strip=True)
                    result[current_semester].append({requirement: credits})
            
    return result
def parse_credit_summary(credit_summary_table):
    credit_summary = {}
    rows = credit_summary_table.find_all("tr")
    for row in rows:
        heading = row.find("span", class_="courselistcomment")
        credits = row.find("td", class_="hourscol")
        if heading and credits:
            heading_text = heading.get_text(strip=True)
            credits_text = credits.get_text(strip=True)
            credit_summary[heading_text] = credits_text

def scrape_major_requirements(url):
    with open("major_links_breakdown.json", "r") as f:
        offerings_list = json.load(f)
    if not offerings_list:
        offerings_list = scrape_major_links_with_breakdown(url)
        logger.error("No offerings links found.")
    
    all_major_requirements = {}
    
    if offerings_list:
        with SB(browser="chrome") as sb:
            for offering_url in offerings_list:
                try:
                    sb.open_new_window()
                    sb.get(offering_url)
                    sb.wait(1)
                    source = sb.get_page_source()
                    soup = BeautifulSoup(source, "html.parser")
                    major_name = soup.find("h1", class_="page-title").get_text(strip=True)
                    
                    # Determine the container based on URL
                    if "coop" in offering_url.lower():
                        requirement_div = soup.find("div", id="cooptextcontainer", class_="page_content tab_content")
                    else:
                        requirement_div = soup.find("div", id="requirementstextcontainer", class_="page_content tab_content")
                    
                    # Make sure we found the requirement div and it has an h2
                    if requirement_div and requirement_div.find("h2"):
                        full_major_name = major_name + " " + requirement_div.find("h2").get_text(strip=True).split(" ")[0]
                    else:
                        full_major_name = major_name
                    
                    # Find tables by their preceding headers
                    credit_summary_table = find_table_by_header(requirement_div, "Credit Summary")
                    program_sequence_table = find_program_sequence_table(requirement_div)
                    
                    # Parse credit summary
                    
                    if credit_summary_table and program_sequence_table:
                        summary_credit = parse_credit_summary(credit_summary_table)
                        program_sequence = parse_program_sequence(program_sequence_table)
                        # Store results
                        all_major_requirements[full_major_name] = {
                        "credit_summary": summary_credit,
                        "program_sequence": program_sequence
                    }
                    
                    else:
                        logger.warning(f"No credit summary table found for {full_major_name}.")
                        continue
                except Exception as e:
                    logger.error(f"Failed to process offering URL {offering_url}: {e}")
                    continue
                    
        # Save all results to file
        with open("all_major_requirements.json", "w") as f:
            json.dump(all_major_requirements, f, indent=4)
            
    return all_major_requirements



if __name__ == "__main__":
    url = "https://calendar.uoguelph.ca/undergraduate-calendar/programs-majors-minors/"
    offerings_list= scrape_major_requirements(url)