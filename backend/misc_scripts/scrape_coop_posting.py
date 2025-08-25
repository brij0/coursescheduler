#!/usr/bin/env python3
"""
Co-op Application Scraper for Experience Guelph
===============================================

This script scrapes your co-op applications from Experience Guelph.
No technical knowledge required - just run this script and follow the instructions!

Requirements: Python 3.6+ and Chrome browser
"""

import os
import sys
import subprocess
import time
import json
from datetime import datetime

def install_requirements():
    """Install required packages automatically."""
    required_packages = [
        'seleniumbase',
        'beautifulsoup4',
        'requests'
    ]
    
    print("🔧 Installing required packages...")
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} already installed")
        except ImportError:
            print(f"📦 Installing {package}...")
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"✅ {package} installed successfully")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install {package}: {e}")
                print("Please install it manually using: pip install " + package)
                sys.exit(1)
    print("🎉 All packages installed!\n")

# Install requirements first
install_requirements()

# Now import the packages
from seleniumbase import SB
from bs4 import BeautifulSoup

class CoopScraper:
    def __init__(self):
        self.cookies_file = "experience_guelph_cookies.json"
        self.output_file = f"coop_applications_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
    def print_banner(self):
        """Print welcome banner."""
        print("=" * 60)
        print("🎓 CO-OP APPLICATION SCRAPER FOR EXPERIENCE GUELPH")
        print("=" * 60)
        print("This script will help you export your co-op applications.")
        print("Please follow the instructions carefully.\n")
    
    def get_user_credentials(self):
        """Get login method from user."""
        print("📋 SETUP INSTRUCTIONS:")
        print("1. Make sure Chrome browser is installed on your computer")
        print("2. Have your Experience Guelph login credentials ready")
        print("3. The script will open Chrome and you'll need to log in manually")
        print("4. After login, wait for the script to complete\n")
        
        input("Press Enter when you're ready to continue...")
        return True
    
    def save_cookies(self):
        """Save login cookies for future use."""
        print("🍪 Setting up login session...")
        
        with SB(browser="chrome", headless=False) as sb:
            try:
                sb.get("https://experienceguelph.ca/home.htm")
                print("\n" + "="*50)
                print("🚨 MANUAL LOGIN REQUIRED")
                print("="*50)
                print("1. A Chrome window has opened")
                print("2. Please log in to Experience Guelph manually")
                print("3. Navigate to your co-op applications page if possible")
                print("4. Come back here and press Enter when you're logged in")
                print("="*50)
                
                input("\nPress Enter after you've successfully logged in...")
                
                cookies = sb.driver.get_cookies()
                with open(self.cookies_file, "w") as f:
                    json.dump(cookies, f, indent=4)
                print("✅ Login session saved!")
                return True
                
            except Exception as e:
                print(f"❌ Error during login setup: {e}")
                return False
    
    def load_cookies(self, sb):
        """Load saved cookies."""
        try:
            with open(self.cookies_file, "r") as file:
                sb.get("https://experienceguelph.ca/home.htm")
                cookies = json.load(file)
                
                for cookie in cookies:
                    # Clean up cookie data
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
                        print(f"⚠️ Warning: Could not load cookie: {e}")
                        
                return True
        except Exception as e:
            print(f"❌ Error loading cookies: {e}")
            return False
    
    def scrape_applications(self):
        """Main scraping function."""
        print("🔍 Starting to scrape your co-op applications...")
        user_major = input("Please Enter your major (e.g. Computer Science, Computer Engineering, etc.): ")
        postings = []
        
        try:
            with SB(browser="chrome", headless=False) as sb:
                # Load cookies
                if not self.load_cookies(sb):
                    print("❌ Failed to load login session")
                    return []
                
                # Navigate to applications page
                applications_url = "https://experienceguelph.ca/myAccount/postings-opportunities/co-op-postings/co-op-applications.htm"
                sb.get(applications_url)
                time.sleep(5)
                
                # Try to select "all" in dropdown
                try:
                    print("📋 Setting filter to show all applications...")
                    if sb.is_element_present('#numOfDays'):
                        sb.click('#numOfDays')
                        time.sleep(2)
                        if sb.is_element_present('option[value="0"]'):
                            sb.click('option[value="0"]')
                            time.sleep(5)
                            print("✅ Filter set to 'all'")
                        else:
                            print("⚠️ Could not find 'all' option, continuing with current filter")
                    else:
                        print("⚠️ Dropdown not found, continuing anyway")
                except Exception as e:
                    print(f"⚠️ Could not change filter: {e}")
                
                # Wait for page to load
                sb.wait_for_element('table.stat-table.table-hover', timeout=10)
                
                # Get page source and find "Total Submitted" button
                page_source = sb.get_page_source()
                soup = BeautifulSoup(page_source, 'html.parser')
                
                print("🔍 Looking for 'Total Submitted' applications...")
                found_total_submitted = False
                
                tables = soup.find_all('table', class_='table stat-table table-hover')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        cells = row.find_all('td')
                        if len(cells) >= 3:
                            if "Total Submitted" in cells[0].get_text().strip():
                                view_button = cells[2].find('a', {'onclick': True})
                                if view_button:
                                    onclick_script = view_button['onclick']
                                    print("📊 Clicking 'View' for Total Submitted...")
                                    sb.execute_script(onclick_script)
                                    found_total_submitted = True
                                    break
                    if found_total_submitted:
                        break
                
                if not found_total_submitted:
                    print("❌ Could not find 'Total Submitted' section")
                    print("💡 Try manually navigating to your applications list")
                    input("Press Enter after you can see your applications table...")
                
                # Wait for applications table to load
                time.sleep(5)
                try:
                    sb.wait_for_element('table.table-striped.table-bordered.table-hover.gridTable', timeout=15)
                except:
                    print("⚠️ Applications table might not have loaded completely")
                
                # Parse applications
                listing_source = sb.get_page_source()
                listing_soup = BeautifulSoup(listing_source, 'html.parser')
                
                table = listing_soup.find('table', class_='table table-striped table-bordered table-hover gridTable')
                if not table:
                    print("❌ Could not find applications table")
                    print("🔧 Saving page source for debugging...")
                    with open("debug_page_source.html", "w", encoding="utf-8") as f:
                        f.write(listing_source)
                    return []
                
                table_body = table.find('tbody')
                if not table_body:
                    print("❌ Applications table has no data")
                    return []
                
                rows = table_body.find_all('tr')
                print(f"📋 Found {len(rows)} application(s)")
                
                for i, row in enumerate(rows):
                    cells = row.find_all('td')
                    if len(cells) >= 10:  # Ensure we have enough cells
                        try:
                            posting = {
                                'user_major': user_major.lower().strip(),
                                'application_number': i + 1,
                                'job_term': cells[1].text.strip() if len(cells) > 1 else '',
                                'job_id': cells[2].text.strip() if len(cells) > 2 else '',
                                'job_title': cells[3].text.strip() if len(cells) > 3 else '',
                                'organization': cells[4].text.strip() if len(cells) > 4 else '',
                                'division': cells[5].text.strip() if len(cells) > 5 else '',
                                'deadline': cells[9].text.strip() if len(cells) > 9 else '',
                                'job_location': cells[14].text.strip() if len(cells) > 14 else '',
                                'scraped_at': datetime.now().isoformat(),
                            }
                            postings.append(posting)
                            print(f"✅ Scraped: {posting['job_title']} at {posting['organization']}")
                        except Exception as e:
                            print(f"⚠️ Error parsing row {i+1}: {e}")
                    else:
                        print(f"⚠️ Row {i+1} has insufficient data ({len(cells)} cells)")
        
        except Exception as e:
            print(f"❌ Error during scraping: {e}")
            print("💡 Make sure you're logged in and on the correct page")
        
        return postings
    
    def save_results(self, postings):
        """Save results to JSON file."""
        if not postings:
            print("❌ No applications found to save")
            return False
        
        try:
            # Create metadata
            result_data = {
                'metadata': {
                    'scraped_at': datetime.now().isoformat(),
                    'total_applications': len(postings),
                    'source': 'Experience Guelph Co-op Applications'
                },
                'applications': postings
            }
            
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Successfully saved {len(postings)} applications to: {self.output_file}")
            print(f"📁 File location: {os.path.abspath(self.output_file)}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving results: {e}")
            return False
    
    def run(self):
        """Main execution function."""
        self.print_banner()
        
        # Check if cookies exist
        if not os.path.exists(self.cookies_file):
            if not self.get_user_credentials():
                return
            if not self.save_cookies():
                print("❌ Failed to set up login session")
                return
        else:
            print("✅ Found existing login session")
        
        # Scrape applications
        applications = self.scrape_applications()
        
        # Save results
        if self.save_results(applications):
            print("\n" + "="*50)
            print("🎉 SUCCESS!")
            print("="*50)
            print(f"Your co-op applications have been exported to: {self.output_file}")
            print("You can now share this file with the person who requested it.")
            print("\n💡 Tips:")
            print("- The file is in JSON format and contains all your application data")
            print("- Your login credentials are NOT saved in this file")
            print("- You can run this script again anytime to get updated data")
        else:
            print("\n❌ Export failed. Please try running the script again.")
            print("If the problem persists, make sure you:")
            print("1. Can access Experience Guelph normally in your browser")
            print("2. Have co-op applications to export")
            print("3. Are connected to the internet")

def main():
    """Entry point."""
    try:
        scraper = CoopScraper()
        scraper.run()
    except KeyboardInterrupt:
        print("\n\n⏹️  Script cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please try running the script again or contact support")
    finally:
        print("\n👋 Script finished. You can close this window.")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()