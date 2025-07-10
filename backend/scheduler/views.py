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
from .models import Course, CourseEvent,Event, Suggestion

#-----------------------------------------
# API endpoint for getting course types
#-----------------------------------------
@require_GET
def get_offered_terms(request):
    terms = (
        Course.objects
        .filter(events__isnull=False)
        .values_list("offered_term", flat=True)
        .distinct()
        .order_by("offered_term")
    )
    return JsonResponse(list(terms), safe=False)
@require_POST
def get_course_types(request):
    try:
        data = json.loads(request.body)
        cterm = data.get("offered_term")
        
        types = (
            Course.objects
            .filter(events__isnull=False, offered_term=cterm)
            .values_list("course_type", flat=True)
            .distinct()
            .order_by("course_type")
        )
        return JsonResponse(list(types), safe=False)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
def conflict_test(request):
    return render(request, "conflict_free_schedule.html")
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

@require_POST
# @csrf_exempt
def get_course_codes(request):
    try:
        data = json.loads(request.body)
        ctype = data.get("course_type")
        cterm = data.get("offered_term")
        if not ctype:
            return JsonResponse({"error": "Course type is required"}, status=400)
            
        codes = (
            Course.objects
            .filter(course_type=ctype,offered_term = cterm, events__isnull=False)
            .values_list("course_code", flat=True)
            .distinct()
            .order_by("course_code")
        )
        return JsonResponse(list(codes), safe=False)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@require_POST
@csrf_exempt
def get_section_numbers(request):
    try:
        data = json.loads(request.body)
        ctype = data.get("course_type")
        code = data.get("course_code")
        cterm = data.get("offered_term")
        print(f"Received course_type: {ctype}, course_code: {code}")
        if not ctype or not code:
            return JsonResponse({"error": "Course type and code are required"}, status=400)
            
        secs = (
            Course.objects
            .filter(course_type=ctype,offered_term = cterm, course_code=code, events__isnull=False)
            .values_list("section_number", flat=True)
            .distinct()
            .order_by("section_number")
        )
        return JsonResponse(list(secs), safe=False)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@require_POST
@csrf_exempt
def search_courses(request):
    try:
        # Parse dynamic form fields course_type_0, course_code_0, section_number_0, …
        all_events = {}
        i = 0
        while True:
            ct = request.POST.get(f"course_type_{i}")
            cc = request.POST.get(f"course_code_{i}")
            sn = request.POST.get(f"section_number_{i}")
            
            if not any([ct, cc, sn]):
                break
                
            if all([ct, cc, sn]):
                key = f"{ct}*{cc}*{sn}"
                evs = list(CourseEvent.objects.filter(
                    course__course_type=ct,
                    course__course_code=cc,
                    course__section_number=sn
                ).values(
                    "event_type","event_date","days","time","location","description","weightage"
                ))
                serializable_evs = []
                for e in evs:
                    e["event_date"] = e["event_date"].isoformat() if e.get("event_date") else None
                    serializable_evs.append(e)
                all_events[key] = serializable_evs
            i += 1

        # Store in session for calendar functionality
        request.session["all_events"] = all_events
        print(f"All events stored in session: {all_events}")
        # Return JSON response for API calls
        if request.headers.get('Content-Type') == 'multipart/form-data' or 'application/json' in request.headers.get('Accept', ''):
            return JsonResponse({"events": all_events})
        
        # Return HTML template for traditional form submissions
        return render(request, "events.html", {"events": all_events})
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def add_to_calendar(request):
    if not request.user.is_authenticated:
        return redirect("/accounts/google/login/")
    if "all_events" not in request.session:
        return redirect("scheduler:index")
    return redirect("scheduler:insert_events")

def insert_events_to_calendar(request):
    all_events = request.session.get("all_events", {})
    
    try:
        # Rebuild credentials from allauth SocialToken
        token = SocialToken.objects.get(account__user=request.user, account__provider="google")
        creds = GoogleCredentials(
            token=token.token,
            refresh_token=token.token_secret,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=[
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                "openid",
            ],
        )
        service = build("calendar", "v3", credentials=creds)

        for course_key, events in all_events.items():
            for e in events:
                date_str = e.get("event_date")
                if not date_str:
                    continue
                    
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    continue

                event_body = {
                    "summary": f"{course_key} - {e['event_type']}",
                    "location": e.get("location", ""),
                    "description": e.get("description", ""),
                    "start": {"date": date_obj.isoformat()},
                    "end": {"date": date_obj.isoformat()},
                    "reminders": {
                        "useDefault": False, 
                        "overrides": [
                            {"method": "email", "minutes": 24*60},
                            {"method": "popup", "minutes": 10},
                        ]
                    },
                }
                service.events().insert(calendarId="primary", body=event_body).execute()

        return JsonResponse({"message": "Events added to calendar successfully"})
        
    except SocialToken.DoesNotExist:
        return JsonResponse({"error": "Google authentication required"}, status=401)
    except Exception as e:
        return JsonResponse({"error": f"Failed to add events: {str(e)}"}, status=500)

# this return same number of combinations as uoguelph.courses but is slow and has some errors
# For only cis2750 both commented conflict_free_schedule and uoguelph.courses give 1 schedule but in reality there are 17 sections and any one will work
# @csrf_exempt
# def conflict_free_schedule(request):
#     """
#     Expects JSON:
#     {
#       "courses": [
#         {"course_type": "ENGG", "course_code": "3380"},
#         {"course_type": "CIS", "course_code": "3750"}
#       ]
#     }
#     Returns all possible combinations of one section per course that are conflict-free.
#     """
#     try:
#         data = json.loads(request.body)
#         selected_courses = data.get("courses", [])
#         course_sections = []
#         for c in selected_courses:
#             sections = Course.objects.filter(
#                 course_type=c["course_type"],
#                 course_code=c["course_code"]
#             )
#             course_sections.append(list(sections))

#         from itertools import product
#         all_combinations = list(product(*course_sections))

#         def get_events_for_section(section):
#             return list(Event.objects.filter(course_id=section.course_id).values(
#                 "event_type", "times", "location"
#             ))

#         def parse_time_range(timestr):
#             parts = [p.strip() for p in timestr.split(',')]
#             days = []
#             time_part = None
#             for p in parts:
#                 if re.match(r'\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M', p):
#                     time_part = p
#                     break
#                 days.append(p)
#             if not time_part:
#                 match = re.search(r'(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)', timestr)
#                 if not match:
#                     return [], None, None
#                 start, end = match.groups()
#             else:
#                 start, end = [t.strip() for t in time_part.split('-')]
#             start_24 = datetime.strptime(start, "%I:%M %p").time()
#             end_24 = datetime.strptime(end, "%I:%M %p").time()
#             return days, start_24, end_24

#         def has_conflict(events):
#             schedule = []
#             for e in events:
#                 days, start, end = parse_time_range(e["times"])
#                 for d in days:
#                     for s in schedule:
#                         if d == s["day"]:
#                             if not (end <= s["start"] or start >= s["end"]):
#                                 return True
#                     schedule.append({"day": d, "start": start, "end": end})
#             return False

#         # Collect all conflict-free schedules
#         conflict_free_schedules = []
#         for combo in all_combinations:
#             all_events = []
#             valid = True
#             result = {}
#             for section in combo:
#                 events = get_events_for_section(section)
#                 if not events:
#                     valid = False  # Section has no events, skip this combo
#                     break
#                 all_events.extend(events)
#                 key = f"{section.course_type}*{section.course_code}*{section.section_number}"
#                 result[key] = events
#             if valid and not has_conflict(all_events):
#                 conflict_free_schedules.append(result)

#         if conflict_free_schedules:
#             return JsonResponse({"schedules": conflict_free_schedules, "message": "All conflict-free schedules found"})
#         return JsonResponse({"error": "No conflict-free schedule possible"}, status=400)
#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500) 
    
@csrf_exempt
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
                    # print(e)
                    parts = [p.strip() for p in e["times"].split(',')]
                    days = e["days"]
                    time_part = None
                    for p in parts:
                        if re.match(r'\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M', p):
                            time_part = p
                            break
                    if not time_part:
                        match = re.search(r'(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)', e["times"])
                        if not match:
                            continue
                        start, end = match.groups()
                    else:
                        start, end = [t.strip() for t in time_part.split('-')]
                    start_24 = datetime.strptime(start, "%I:%M %p").time()
                    end_24 = datetime.strptime(end, "%I:%M %p").time()
                    print(f"Start: {start_24}, End: {end_24}, Days: {days}")
                    for d in days:
                        time_slots.append((d, start_24, end_24, e["event_type"]))
                section_events.append({
                    'section': section,
                    'events': events,
                    'time_slots': time_slots,
                    'key': f"{section.course_type}*{section.course_code}*{section.section_number}"
                })
            course_data.append(section_events)
            logger.info(f"Course {course['course_type']}{course['course_code']}: {len(section_events)} sections with events")
        print(course_data)
        # Conflict checking helper
        def events_conflict(slots1, slots2):
            for day1, start1, end1, _ in slots1:
                for day2, start2, end2, _ in slots2:
                    if day1 == day2:
                        if not (end1 <= start2 or start1 >= end2):
                            return True
            return False

        # Backtracking to find ALL schedules first
        all_schedules = []

        def build_schedules(course_index, current_schedule, current_slots):
            if course_index >= len(course_data):
                all_schedules.append(current_schedule.copy())
                return
            for section_data in course_data[course_index]:
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

        # Now paginate the results
        total_found = len(all_schedules)
        paginated_schedules = all_schedules[offset:offset+limit]

        response_data = {
            "schedules": paginated_schedules,
            "total": total_found,
            "offset": offset,
            "limit": limit,
            "message": f"Showing {len(paginated_schedules)} of {total_found} conflict-free schedules"
        }
        logger.info(f"Found {total_found} conflict-free schedules in {time.time() - total_start:.2f}s")
        logger.info(f"Returned {len(paginated_schedules)} schedules out of {total_found} found in {time.time() - total_start:.2f}s")
        return JsonResponse(response_data)
    except Exception as e:
        logger.error(f"Error in conflict_free_schedule: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


# Helper function (same as original)
def parse_time_range(timestr):
    """Parse time string into days, start_time, end_time"""
    parts = [p.strip() for p in timestr.split(',')]
    days = []
    time_part = None
    
    for p in parts:
        if re.match(r'\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M', p):
            time_part = p
            break
        days.append(p)
    
    if not time_part:
        match = re.search(r'(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)', timestr)
        if not match:
            return [], None, None
        start, end = match.groups()
    else:
        start, end = [t.strip() for t in time_part.split('-')]
    
    start_24 = datetime.strptime(start, "%I:%M %p").time()
    end_24 = datetime.strptime(end, "%I:%M %p").time()
    
    return days, start_24, end_24
def privacy_policy(request):
    return render(request, "privacy.html")

@require_POST
@csrf_exempt
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

@require_POST
@csrf_exempt
def upload_course_outline(request):
    try:
        ctype = request.POST.get("course_type")
        ccode = request.POST.get("course_code")
        file = request.FILES.get("course_outline")
        
        if not (ctype and ccode and file):
            return JsonResponse({"error": "All fields are required"}, status=400)

        UPLOAD_DIR = settings.BASE_DIR / "Sample Course Outlines"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"{ctype}_{ccode}.pdf"
        fs = FileSystemStorage(location=UPLOAD_DIR)
        
        if fs.exists(filename):
            return JsonResponse({"message": "File already exists"})
            
        fs.save(filename, file)
        return JsonResponse({"message": "File uploaded successfully"})
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)