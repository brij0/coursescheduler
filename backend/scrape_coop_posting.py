import os
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

def scrape_coop_postings():
    """Scrapes coop postings from the Experience Guelph website."""

    with SB(browser="chrome") as sb:
        sb.get("https://experienceguelph.ca")
        
        # Load cookies
        with open("cookies.json", "r") as file:
            cookies = json.load(file)
            for cookie in cookies:
                cookie.pop('domain', None)
                cookie.pop('path', None)
                cookie.pop('secure', None)
                cookie.pop('httpOnly', None)
                cookie.pop('sameSite', None)
                cookie.pop('storeId', None)
                cookie.pop('id', None)
                if 'expiry' in cookie:
                    cookie['expiry'] = int(cookie['expiry'])
                try:
                    sb.driver.add_cookie(cookie)
                except Exception as e:
                    print(f"Error adding cookie: {e}")
        time.sleep(5)
        sb.get("https://experienceguelph.ca/myAccount/postings-opportunities/offcampus-postings.htm")
        time.sleep(5)
        
        # Find all clickable links first
                # Find all clickable links first and extract their data
                # Find all clickable links first and extract their data
        links = sb.find_elements('td.full a[onclick]')
        link_data = []
        for link in links:
            try:
                link_data.append({
                    'text': link.text.strip(),
                    'onclick': link.get_attribute('onclick')
                })
            except Exception as e:
                print(f"Error extracting link data: {e}")
                continue
        
        # Save link data to file for later use
        with open('coop_links.json', 'w') as f:
            json.dump(link_data, f, indent=2)
        print(f"Saved {len(link_data)} links to coop_links.json")
        
        # Process each link
        for i, data in enumerate(link_data):
            print(f"\n{'='*50}")
            print(f"Processing link {i+1} of {len(link_data)}, link text: {data['text']}")
            try:
                # Navigate back to main page first (ensure we're on the right page)
                sb.get("https://experienceguelph.ca/myAccount/postings-opportunities/offcampus-postings.htm")
                time.sleep(2)     
                print(f"Executing JavaScript: {data['onclick']}")
                sb.execute_script(data['onclick'])
                time.sleep(3)  # Wait for page to load
                current_page_source = sb.get_page_source()
                current_soup = BeautifulSoup(current_page_source, 'html.parser')
                print(f"Page title: {sb.get_title()}")
            except Exception as e:
                print(f"Error processing link {i+1}: {e}")
                continue
if __name__ == "__main__":
    scrape_coop_postings()
    # with SB(browser="chrome") as sb:
    #     sb.get("https://experienceguelph.ca/home.htm")
    #     print("⏳ Please log in manually...")
    #     time.sleep(60)  # Wait for manual login (adjust as needed)
        
    #     cookies = sb.driver.get_cookies()
    #     with open("cookies.json", "w") as f:
    #         json.dump(cookies, f, indent=4)
    #     print("✅ Cookies saved to cookies.json")