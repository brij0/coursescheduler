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
# with SB(browser="chrome") as sb:
#     sb.get("https://experienceguelph.ca/home.htm")
#     print("⏳ Please log in manually...")
#     time.sleep(60)  # Wait for manual login (adjust as needed)
    
#     cookies = sb.driver.get_cookies()
#     with open("cookies.json", "w") as f:
#         json.dump(cookies, f, indent=4)
#     print("✅ Cookies saved to cookies.json")

def scrape_coop_postings():
    """Scrapes coop postings from the Experience Guelph website."""

    with SB(browser="chrome") as sb:
        sb.get("https://experienceguelph.ca")
        
        # Load cookies
        with open("cookies.json", "r") as file:
            cookies = json.load(file)
            for cookie in cookies:
                cookie.pop('domain', None)  # Remove 'domain' key if it exists
                cookie.pop('path', None)  # Remove 'path' key if it exists
                cookie.pop('secure', None)  # Remove 'secure' key if it exists
                cookie.pop('httpOnly', None)  # Remove 'httpOnly' key if it exists
                cookie.pop('sameSite', None)
                cookie.pop('storeId', None)
                cookie.pop('id', None)
                if 'expiry' in cookie:
                    cookie['expiry'] = int(cookie['expiry'])
                try:
                    sb.driver.add_cookie(cookie)  # Use sb.driver.add_cookie
                except Exception as e:
                    print(f"Error adding cookie: {e}")
        sb.get_cookies()
        time.sleep(5)
        sb.get("https://experienceguelph.ca/myAccount/dashboard.htm")
        time.sleep(5)

if __name__ == "__main__":
    scrape_coop_postings()