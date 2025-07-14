# scheduler/views.py
import os, json, pathlib
from datetime import datetime
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from allauth.socialaccount.models import SocialToken
from google.oauth2.credentials import Credentials as GoogleCredentials
from googleapiclient.discovery import build
import re
import time
import logging
from datetime import datetime
from .models import Course, CourseEvent, Event, Suggestion
from applogger.views import log_app_activity, log_user_year_estimate, log_api_timing,log_client_error
import requests # For Outlook calendar integration
#-----------------------------------------
# Index page
#-----------------------------------------
def index(request):
    # SHOW COURSE TYPES
    course_types = (
        Course.objects
        .filter(events__isnull=False)
        .values_list("course_type", flat=True)
        .distinct()
        .order_by("course_type")
    )
    return render(request, "index.html", {"course_types": course_types})

#-----------------------------------------
# Home page of events and course_events function which populates the events page
#-----------------------------------------
def events_page(request):
    return render(request, "events.html")

@require_POST
@csrf_exempt
@log_api_timing("course_events_schedule")
def course_events_schedule(request):
    """
    API: Get all events for multiple course sections

    Request:
        JSON: {
            "sections": [
                {
                    "course_type": "CIS",
                    "course_code": "3750",
                    "section_number": "01",
                    "offered_term": "Fall 2025"
                },
                ...
            ]
        }

    Response:
        {
            "CIS*3750*01": [ ...events... ],
            ...
        }
    """
    data = json.loads(request.body)
    print(f"Received data: {data}")
    sections = data.get("sections") or data.get("courses", [])
    all_events = []
    for s in sections:
        key = f"{s['course_type']}*{s['course_code']}*{s['section_number']}"
        evs = CourseEvent.objects.filter(
            course__course_type=s["course_type"],
            course__course_code=s["course_code"],
            course__section_number=s["section_number"],
            course__offered_term=s["offered_term"]
        ).values("id", "event_type", "weightage", "event_date", "location", "description", "time")
        for ev in evs:
            ev = dict(ev)
            ev["course"] = key
            all_events.append(ev)
    return JsonResponse({"events": all_events})


#---------------------------------------------------------------------------
# Home page of conflict_free schedule
#---------------------------------------------------------------------------

def conflict_test(request):
    return render(request, "conflict_free_schedule.html")

@csrf_exempt
@log_api_timing("conflict_free_schedule")
def conflict_free_schedule(request):
    """
    Expects JSON:
    {
      "courses": [
        {"course_type": "ENGG", "course_code": "3380"},
        {"course_type": "CIS", "course_code": "3750"}
      ],
      "offset": 0,
      "limit": 100
    }
    Returns paginated conflict-free schedules.
    """
    logger = logging.getLogger(__name__)
    total_start = time.time()

    try:
        data = json.loads(request.body)
        selected_courses = data.get("courses", [])
        offered_term = data.get("offered_term", None)
        offset = int(data.get("offset", 0))
        limit = int(data.get("limit", 50))

        # Get all sections for each course with their events
        course_data = []
        for course in selected_courses:
            sections = Course.objects.filter(
                course_type=course["course_type"],
                course_code=course["course_code"],
                offered_term=offered_term
            )
            section_events = []
            for section in sections:
                events = list(Event.objects.filter(course_id=section.course_id).values(
                    "event_type", "times", "location", "days"
                ))
                if not events:
                    continue
                # Parse time slots for conflict checking
                time_slots = []
                for e in events:
                    times = e["times"].split('-')
                    days = []
                    if e["days"]:
                        for words in e["days"].split(','):
                            if words.strip():
                                days.append(words.strip())
                    time_part = e["times"]
                    if times:
                        try :
                            start, end = [t.strip() for t in time_part.split('-')]
                            start_24 = datetime.strptime(start, "%I:%M %p").time()
                            end_24 = datetime.strptime(end, "%I:%M %p").time()
                        except:
                            start_24 = end_24 = None
                        # print(f"Start: {start_24}, End: {end_24}, Days: {days}")
                    else:
                        start_24 = end_24 = None
                    for d in days:
                        time_slots.append((d, start_24, end_24, e["event_type"]))
                    # print(time_slots)
                section_events.append({
                    'section': section,
                    'events': events,
                    'time_slots': time_slots,
                    'key': f"{section.course_type}*{section.course_code}*{section.section_number}"
                })
            course_data.append(section_events)
            logger.info(f"Course {course['course_type']}{course['course_code']}: {len(section_events)} sections with events")
        # print(course_data)
        # Conflict checking helper
        def events_conflict(slots1, slots2):
            for day1, start1, end1, _ in slots1:
                for day2, start2, end2, _ in slots2:
                    if day1 == day2:
                        # Skip if any time is None
                        if None in (start1, end1, start2, end2):
                            continue
                        if not (end1 <= start2 or start1 >= end2):
                            return True
            return False

        found_schedules = []
        schedules_skipped = 0

        def build_schedules(course_index, current_schedule, current_slots):
            nonlocal schedules_skipped
            
            # Stop if we have enough schedules for this page
            if len(found_schedules) >= limit:
                return
                
            if course_index >= len(course_data):
                if schedules_skipped < offset:
                    schedules_skipped += 1
                else:
                    found_schedules.append(current_schedule.copy())
                return
                
            for section_data in course_data[course_index]:
                # Stop if we have enough schedules for this page
                if len(found_schedules) >= limit:
                    return
                    
                new_slots = section_data['time_slots']
                conflict_found = False
                for existing_slots in current_slots:
                    if events_conflict(existing_slots, new_slots):
                        conflict_found = True
                        break
                if not conflict_found:
                    new_schedule = current_schedule.copy()
                    new_schedule[section_data['key']] = section_data['events']
                    new_slot_list = current_slots + [new_slots]
                    build_schedules(course_index + 1, new_schedule, new_slot_list)

        build_schedules(0, {}, [])

        # Check if we potentially have more schedules by trying to find one more
        has_more = False
        if len(found_schedules) == limit:
            # Try to find one more schedule to see if there are more available
            temp_found = []
            temp_skipped = schedules_skipped
            
            def check_more_schedules(course_index, current_schedule, current_slots):
                nonlocal temp_skipped
                
                if len(temp_found) >= 1:  # We only need to find one more
                    return
                    
                if course_index >= len(course_data):
                    if temp_skipped < offset + limit:
                        temp_skipped += 1
                    else:
                        temp_found.append(current_schedule.copy())
                    return
                    
                for section_data in course_data[course_index]:
                    if len(temp_found) >= 1:
                        return
                        
                    new_slots = section_data['time_slots']
                    conflict_found = False
                    for existing_slots in current_slots:
                        if events_conflict(existing_slots, new_slots):
                            conflict_found = True
                            break
                    if not conflict_found:
                        new_schedule = current_schedule.copy()
                        new_schedule[section_data['key']] = section_data['events']
                        new_slot_list = current_slots + [new_slots]
                        check_more_schedules(course_index + 1, new_schedule, new_slot_list)
            
            check_more_schedules(0, {}, [])
            has_more = len(temp_found) > 0
        
        response_data = {
            "schedules": found_schedules,
            "total": "unknown",  # We don't calculate total anymore for performance
            "offset": offset,
            "limit": limit,
            "has_more": has_more,
            "message": f"Showing {len(found_schedules)} conflict-free schedules"
        }
        logger.info(f"Found {len(found_schedules)} conflict-free schedules in {time.time() - total_start:.2f}s")
        logger.info(f"Returned {len(found_schedules)} schedules in {time.time() - total_start:.2f}s")
        return JsonResponse(response_data)
    except Exception as e:
        logger.error(f"Error in conflict_free_schedule: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)
    

#----------------------------------
# Suggestion API
#----------------------------------
@require_POST
@csrf_exempt
@log_api_timing("submit_suggestion")
def submit_suggestion(request):
    try:
        data = json.loads(request.body)
        text = data.get("suggestion")
        if not text:
            return JsonResponse({"error": "Suggestion text is required"}, status=400)
        Suggestion.objects.create(text=text)
        return JsonResponse({"message": "Thank you for your feedback!"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


#----------------------------------
# Extras and pending/require fixes
#----------------------------------

def add_to_calendar(request):
    if not request.user.is_authenticated:
        return redirect("/accounts/google/login/")
    if "all_events" not in request.session:
        return redirect("scheduler:index")
    return redirect("scheduler:insert_events")

def insert_events_to_outlook(request):
    """
    Simple function to add events to Outlook calendar using Microsoft Graph API
    Similar to your Google Calendar implementation
    """
    all_events = request.session.get("all_events", {})
    
    try:
        # Get Microsoft/Outlook token from allauth
        token = SocialToken.objects.get(account__user=request.user, account__provider="microsoft")
        access_token = token.token
        
        # Microsoft Graph API headers
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Microsoft Graph API endpoint
        graph_url = "https://graph.microsoft.com/v1.0/me/events"
        
        for course_key, events in all_events.items():
            for e in events:
                date_str = e.get("event_date")
                if not date_str:
                    continue
                    
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    continue

                # Create event body for Microsoft Graph API
                event_body = {
                    "subject": f"{course_key} - {e['event_type']}",
                    "location": {
                        "displayName": e.get("location", "")
                    },
                    "body": {
                        "contentType": "text",
                        "content": e.get("description", "")
                    },
                    "start": {
                        "dateTime": f"{date_obj.isoformat()}T09:00:00",
                        "timeZone": "UTC"
                    },
                    "end": {
                        "dateTime": f"{date_obj.isoformat()}T10:00:00", 
                        "timeZone": "UTC"
                    },
                    "isAllDay": False,
                    "isReminderOn": True,
                    "reminderMinutesBeforeStart": 60,  # 1 hour before
                    "importance": "normal"
                }
                
                # Make API call to create event
                response = requests.post(graph_url, headers=headers, json=event_body)
                response.raise_for_status()  # Raise exception for bad status codes

        return JsonResponse({"message": "Events added to Outlook calendar successfully"})
        
    except SocialToken.DoesNotExist:
        return JsonResponse({"error": "Microsoft/Outlook authentication required"}, status=401)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Failed to add events to Outlook: {str(e)}"}, status=500)
    except Exception as e:
        return JsonResponse({"error": f"Failed to add events: {str(e)}"}, status=500)