# scheduler/views.py
import json
from datetime import datetime
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import time
import logging
from datetime import datetime, timedelta
from .models import Course, CourseEvent, Event, Suggestion
from gpacalc.models import AssignmentCalendarProgress
from icalendar import Calendar
from icalendar import Event as calendarEvent
import pytz

# -----------------------------------------
# API: Get Course Events for selected sections
# -----------------------------------------
@require_POST
@csrf_exempt
def course_events_schedule(request):
    """
    API: Get all events for multiple course sections
    
    This endpoint returns detailed event information for specified course sections.
    Frontend can use this to display event details in a calendar or list view.

    Request:
        JSON: {
            "sections/courses": [
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
            "CIS*3750*01": [
                {
                    "id": 123,
                    "event_type": "Lecture",
                    "weightage": "20%",
                    "event_date": "2025-09-10",
                    "location": "Room 101",
                    "description": "Introduction to concepts",
                    "time": "10:00 AM - 11:20 AM"
                },
                ...
            ],
            ...
        }
    """
    data = json.loads(request.body)
    courses = data.get("sections") or data.get("courses", [])
    
    # Extract the offered_term from the first course (all should have the same term)
    offered_term = courses[0].get("offered_term", "") if courses else ""
    
    result = {}
    for c in courses:
        key = f"{c['course_type']}*{c['course_code']}*{c['section_number']}"
        evs = CourseEvent.objects.filter(
            course__course_type=c["course_type"],
            course__course_code=c["course_code"],
            course__section_number=c["section_number"],
            course__offered_term=c["offered_term"]
        ).values("id", "event_type", "weightage", "event_date", "location", "description", "time")
        result[key] = list(evs)
    
    # Save progress data
    progress_data = {
        "offered_term": offered_term,
        "course_events": result,
    }
    
    # Import the model at the top of the file if not already imported
    from gpacalc.models import AssignmentCalendarProgress
    
    if request.user.is_authenticated:
        AssignmentCalendarProgress.objects.update_or_create(
            user=request.user,
            defaults={'data': progress_data}
        )
    else:
        request.session['assignment_calendar_progress'] = progress_data
    
    return JsonResponse(result, safe=False)

# -----------------------------------------
# API: Generate Conflict-Free Schedules
# -----------------------------------------
@csrf_exempt
def conflict_free_schedule(request):
    """
    API: Generate paginated conflict-free schedules for selected courses.

    This endpoint uses a backtracking algorithm to find schedules without time conflicts.
    Pagination is implemented to avoid overloading the browser with too many schedules.
    Limited to checking first 5,000 possible combinations for performance.

    Request:
        JSON: {
            "courses": [
                {"course_type": "ENGG", "course_code": "3380", "course_section": "02"}, 
                # Here course_section is optional, if user wants to select a specific section for a specific course they can do that, if no section is provided, 
                # all sections for that course will be considered.
                {"course_type": "CIS", "course_code": "3750"}
            ],
            "offered_term": "Fall 2025",
            "offset": 0,
            "limit": 100
        }

    Response:
        {
            "schedules": [
                {
                    "CIS*3750*01": [
                        {event details...},
                        ...
                    ],
                    "ENGG*3380*02": [
                        {event details...},
                        ...
                    ]
                },
                ... more schedules ...
            ],
            "total": "unknown",  
            "offset": 0,
            "limit": 100,
            "has_more": true/false,
            "message": "Showing N conflict-free schedules",
            "search_limited": true/false 
        }

    Frontend Implementation Notes:
    - Use offset/limit for pagination - load more schedules as user scrolls
    - Display schedules in calendar format with color-coding by course
    - For each schedule, display all sections with their events
    - Provide a "Next Schedule" / "Previous Schedule" navigation
    - Consider adding filters (e.g., "no early mornings", "compact schedule")
    - Check "search_limited" field to inform users if search was capped
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
        course_section_numbers = {}
        total_combinations = 1
        
        for course in selected_courses:
            # Here course_section is optional, if user wants to select a specific section for a specific course they can do that, if no section is provided, 
            # all sections for that course will be considered.
            if not course.get("course_section"):
                sections = Course.objects.filter(
                    course_type=course["course_type"],
                    course_code=course["course_code"],
                    offered_term=offered_term
                )
            else:
                sections = Course.objects.filter(
                    course_type=course["course_type"],
                    course_code=course["course_code"],
                    section_number=course["course_section"],
                    offered_term=offered_term
                )
            course_section_numbers[f"{course['course_type']}*{course['course_code']}"] = len(sections)
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
                        for day in e["days"].split(','):
                            if day.strip():
                                days.append(day.strip())
                    
                    time_part = e["times"]
                    if times:
                        try:
                            start, end = [t.strip() for t in time_part.split('-')]
                            start_24 = datetime.strptime(start, "%I:%M %p").time()
                            end_24 = datetime.strptime(end, "%I:%M %p").time()
                        except:
                            logger.error(f"Error parsing time '{time_part}' for event {e}")
                            start_24 = end_24 = None
                    else:
                        start_24 = end_24 = None
                        
                    for d in days:
                        time_slots.append((d, start_24, end_24, e["event_type"]))
                        
                section_events.append({
                    'section': section,
                    'events': events,
                    'time_slots': time_slots,
                    'key': f"{section.course_type}*{section.course_code}*{section.section_number}"
                })
                
            course_data.append(section_events)
            total_combinations *= len(section_events) if section_events else 1
            logger.info(f"Course {course['course_type']}{course['course_code']}: {len(section_events)} sections with events")

        # Check if total combinations exceed 100,000 and log warning
        search_limited = total_combinations > 100000
        max_combinations_to_check = min(total_combinations, 5000)
        
        if search_limited:
            logger.warning(f"Total combinations ({total_combinations}) exceed 100K. Limiting search to first 5,000 combinations.")

        # Conflict checking helper function
        def events_conflict(slots1, slots2):
            """Check if two sets of time slots have any conflicts"""
            for day1, start1, end1, _ in slots1:
                for day2, start2, end2, _ in slots2:
                    if day1 == day2:
                        # Skip if any time is None
                        if None in (start1, end1, start2, end2):
                            continue
                        if not (end1 <= start2 or start1 >= end2):
                            return True
            return False

        # Modified backtracking to find schedules lazily with combination limit
        found_schedules = []
        schedules_skipped = 0
        combinations_checked = 0

        def build_schedules(course_index, current_schedule, current_slots):
            """
            Recursive backtracking to build conflict-free schedules
            Limited to checking first 10,000 combinations for performance.
            
            Args:
                course_index: Index of current course in course_data
                current_schedule: Current partial schedule being built
                current_slots: List of time slots already in the schedule
            """
            nonlocal schedules_skipped, combinations_checked
            
            # Stop if we have enough schedules for this page
            if len(found_schedules) >= limit:
                return
                
            # Stop if we've checked maximum allowed combinations
            if combinations_checked >= max_combinations_to_check:
                return
                
            # Base case: all courses have been processed
            if course_index >= len(course_data):
                combinations_checked += 1
                if schedules_skipped < offset:
                    schedules_skipped += 1
                else:
                    found_schedules.append(current_schedule.copy())
                return
                
            # Try each section of the current course
            for section_data in course_data[course_index]:
                # Stop if we have enough schedules for this page
                if len(found_schedules) >= limit:
                    return
                    
                # Stop if we've checked maximum allowed combinations
                if combinations_checked >= max_combinations_to_check:
                    return
                    
                new_slots = section_data['time_slots']
                conflict_found = False
                
                # Check for conflicts with existing slots
                for existing_slots in current_slots:
                    if events_conflict(existing_slots, new_slots):
                        conflict_found = True
                        break
                        
                if not conflict_found:
                    new_schedule = current_schedule.copy()
                    new_schedule[section_data['key']] = section_data['events']
                    new_slot_list = current_slots + [new_slots]
                    build_schedules(course_index + 1, new_schedule, new_slot_list)
        
        # Start the recursive schedule building
        build_schedules(0, {}, [])

        # Check if we potentially have more schedules by trying to find one more
        has_more = False
        if len(found_schedules) == limit and combinations_checked < max_combinations_to_check:
            # Try to find one more schedule to see if there are more available
            temp_found = []
            temp_skipped = schedules_skipped
            temp_combinations_checked = combinations_checked
            
            def check_more_schedules(course_index, current_schedule, current_slots):
                """Helper function to check if more schedules exist beyond current limit"""
                nonlocal temp_skipped, temp_combinations_checked
                
                if len(temp_found) >= 1:  # We only need to find one more
                    return
                    
                # Stop if we've reached the combination limit
                if temp_combinations_checked >= max_combinations_to_check:
                    return
                    
                if course_index >= len(course_data):
                    temp_combinations_checked += 1
                    if temp_skipped < offset + limit:
                        temp_skipped += 1
                    else:
                        temp_found.append(current_schedule.copy())
                    return
                    
                for section_data in course_data[course_index]:
                    if len(temp_found) >= 1:
                        return
                        
                    if temp_combinations_checked >= max_combinations_to_check:
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
        elif combinations_checked >= max_combinations_to_check:
            # If we hit the combination limit, there might be more schedules we haven't checked
            has_more = False  # Set to False since we're capping the search
        
        # Determine message based on search limitations
        message = f"Showing {len(found_schedules)} conflict-free schedules"
        if search_limited:
            message += f" (search limited to first {max_combinations_to_check:,} combinations)"
        
        response_data = {
            "schedules": found_schedules,
            "total": "unknown",  # We don't calculate total anymore for performance
            "offset": offset,
            "limit": limit,
            "has_more": has_more,
            "message": message,
            "search_limited": search_limited,
            "combinations_checked": combinations_checked,
            "total_possible_combinations": total_combinations if not search_limited else f"{total_combinations:,}+"
        }
        
        logger.info(f"Found {len(found_schedules)} conflict-free schedules from {combinations_checked} combinations checked in {time.time() - total_start:.2f}s")
        if search_limited:
            logger.info(f"Search was limited due to high number of possible combinations ({total_combinations:,})")
            
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error in conflict_free_schedule: {str(e)}")
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
            course = f"{_}"
            for event in value:
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

# -----------------------------------------
# API: Submit a suggestion/feedback
# -----------------------------------------
@require_POST
@csrf_exempt
def submit_suggestion(request):
    """
    API: Submit a suggestion or feedback for the course scheduler
    
    This endpoint allows users to submit feedback which gets stored in the database.
    
    Request:
        JSON: {
            "suggestion": "Please add more course sections for popular classes"
        }
        
    Response:
        JSON: {
            "message": "Thank you for your feedback!"
        }
        
    Frontend Implementation Notes:
    - Add a feedback form on the scheduler page
    - Show success message after submission
    - Consider adding categories for feedback types
    """
    try:
        data = json.loads(request.body)
        suggestion_text = data.get("suggestion", "")
        
        if not suggestion_text:
            return JsonResponse({"error": "Suggestion text is required"}, status=400)
            
        # Create and save the suggestion
        suggestion = Suggestion(text=suggestion_text)
        suggestion.save()
        
        return JsonResponse({"message": "Thank you for your feedback!"})     
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)