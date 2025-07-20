# scheduler/views.py
import json
from datetime import datetime
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import time
import logging
from datetime import datetime, timedelta
from .models import Course, CourseEvent, Event, Suggestion
from applogger.views import log_api_timing
from icalendar import Calendar
from icalendar import Event as calendarEvent
import pytz
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
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    # print(f"Received data: {data}")
    sections = data.get("sections") or data.get("courses", [])
    events_by_course = {}
    for s in sections:
        key = f"{s['course_type']}*{s['course_code']}*{s['section_number']}"
        evs = CourseEvent.objects.filter(
            course__course_type=s["course_type"],
            course__course_code=s["course_code"],
            course__section_number=s["section_number"],
            course__offered_term=s["offered_term"]
        ).values("id", "event_type", "weightage", "event_date", "location", "description", "time")
        events_by_course[key] = list(evs)
        # print(events_by_course)
    return JsonResponse(events_by_course)


#---------------------------------------------------------------------------
# Home page of conflict_free schedule
#---------------------------------------------------------------------------

def conflict_test(request):
    return render(request, "conflict_free_schedule.html")

@csrf_exempt
@log_api_timing("conflict_free_schedule")
def conflict_free_schedule(request):
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


# -----------------------------------------
# API: Export Events to Calendar Format
# -----------------------------------------
@require_POST
@csrf_exempt
def export_events_ics_format(request):
    """
    Export events as ICS file for download
    
    This endpoint generates a standard iCalendar format file that can be imported
    into Google Calendar, Apple Calendar, Outlook, etc.
    
    Request:
        JSON: {
            "CIS*3750*01": [
                {
                    "course": "CIS*3750",
                    "event_type": "Lecture",
                    "event_date": "2025-09-10",
                    "location": "Room 101",
                    "description": "Introduction",
                    "weightage": "20%",
                    "time": "10:00 AM - 11:20 AM"
                },
                ...
            ],
            ...
        }
        
    Response:
        Binary ICS file with Content-Disposition: attachment
        
    Frontend Implementation Notes:
    - Send selected schedule data to this endpoint
    - Handle the response as a file download
    - Display success message after download
    - Provide instructions for importing to different calendar apps
    """
    calendar = Calendar()
    calendar.add('prodid', '-//My calendar product//example.com//')
    calendar.add('version', '2.0')
    
    try:
        data = json.loads(request.body)
        
        for _, value in data.items():
            for event in value:
                course = event.get("course", {})
                event_type = event.get("event_type", {})
                event_date = event.get("event_date", "")
                location = event.get("location", "")
                description = f"{event.get('description', '')} with weightage of {event.get('weightage', '')}"
                time_str = event.get("time", "").replace("?", "-")
                
                # Split time range and extract start time
                start_time = ""
                if "-" in time_str:
                    start_time = time_str.split("-")[0].strip()
                else:
                    start_time = time_str.strip()
                
                # Try to detect AM/PM, if missing, default to AM
                if not (start_time.lower().endswith("am") or start_time.lower().endswith("pm")):
                    start_time += " AM"
                
                cal_event = calendarEvent()
                cal_event.add('summary', f"{course} {event_type}")
                cal_event.add('description', description)
                cal_event.add('location', location)
                
                try:
                    dtstart = datetime.strptime(event_date + ' ' + start_time, '%Y-%m-%d %I:%M %p')
                except ValueError:
                    # fallback: try without AM/PM
                    try:
                        dtstart = datetime.strptime(event_date + ' ' + start_time.replace(" AM", ""), '%Y-%m-%d %H:%M')
                    except Exception:
                        continue  # skip this event if parsing fails
                
                cal_event.add('dtstart', pytz.timezone('US/Eastern').localize(dtstart))
                cal_event.add('dtend', pytz.timezone('US/Eastern').localize(dtstart + timedelta(hours=1)))
                calendar.add_component(cal_event)
        
        # Generate the ICS content
        ics_content = calendar.to_ical()
        
        # Create HTTP response with the ICS file
        response = HttpResponse(ics_content, content_type='text/calendar')
        response['Content-Disposition'] = 'attachment; filename="events.ics"'
        
        return response
        
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON data")
    except Exception as e:
        return HttpResponseBadRequest(f"Error processing request: {str(e)}")