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

from .models import Course, CourseEvent, Suggestion

# API endpoint for getting course types
@require_GET
def get_course_types(request):
    types = (
        Course.objects
        .filter(events__isnull=False)
        .values_list("course_type", flat=True)
        .distinct()
        .order_by("course_type")
    )
    return JsonResponse(list(types), safe=False)

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
@csrf_exempt
def get_course_codes(request):
    try:
        data = json.loads(request.body)
        ctype = data.get("course_type")
        
        if not ctype:
            return JsonResponse({"error": "Course type is required"}, status=400)
            
        codes = (
            Course.objects
            .filter(course_type=ctype, events__isnull=False)
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
        print(f"Received course_type: {ctype}, course_code: {code}")
        if not ctype or not code:
            return JsonResponse({"error": "Course type and code are required"}, status=400)
            
        secs = (
            Course.objects
            .filter(course_type=ctype, course_code=code, events__isnull=False)
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