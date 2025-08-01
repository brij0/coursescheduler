from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.http import JsonResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
import json
from django.db import models
import datetime
from .models import  AppSession, UserYearEstimate, CoursetypetoSchool, ApiTimingLog
from .utils import log_info, log_error
import time
import traceback
from functools import wraps
from django.views.decorators.http import require_http_methods
@csrf_exempt
@require_http_methods(["GET", "POST"])
def log_app_activity(request, app_name, section_name):
    # Don't create a session if one doesn't exist
    session_id = request.session.session_key
    if not session_id:
        return JsonResponse({"status": "error", "error": "No session found"}, status=400)

    user = request.user if request.user.is_authenticated else None
    now = timezone.now()
    
    try:
        obj, created = AppSession.objects.get_or_create(
            user=user,
            section_name=section_name,
            app_name=app_name,
            session_id=session_id,
            defaults={'start_time': now, 'last_api_call_time': now}
        )
        if not created:
            obj.last_api_call_time = now
            duration_seconds = (now - obj.start_time).total_seconds()
            obj.duration = datetime.timedelta(seconds=duration_seconds)
            obj.save()
        return JsonResponse({"status": "ok"})
    except Exception as e:
        log_error("Failed to log app activity", extra={
            "error": str(e), 
            "app_name": app_name, 
            "section_name": section_name, 
            "user": user
        })
        return JsonResponse({"status": "error", "error": str(e)}, status=500)
@csrf_exempt
@require_POST
def log_user_year_estimate(request):
    try:
        data = json.loads(request.body)
        courses = data.get("courses", [])
        
        if request.user.is_authenticated:
            user = request.user
            session_key = None
        else:
            user = None
            # Ensure the session exists
            if not request.session.session_key:
                request.session.save()
            session_key = request.session.session_key
        if not courses:
            # fallback to single course dict for backward compatibility
            courses = [{
                "course_type": data.get("course_type"),
                "course_code": data.get("course_code"),
                "section_number": data.get("section_number"),
                "offered_term": data.get("offered_term"),
            }]
        # Find most common course_type
        course_types = [c.get("course_type") for c in courses if c.get("course_type")]
        most_common_type = max(set(course_types), key=course_types.count) if course_types else None
        school_obj = CoursetypetoSchool.objects.filter(course_type=most_common_type).first() if most_common_type else None
        school = school_obj.school if school_obj and hasattr(school_obj, "school") else ""

        # Find most common year from course_code
        years = []
        for c in courses:
            code = str(c.get("course_code", ""))
            if len(code) >= 4 and code[:1].isdigit():
                year_digit = code[0]
                year_digit = '4' if year_digit > '4' else year_digit
                years.append(year_digit)
            elif len(code) >= 4 and code[1].isdigit():
                year_digit = code[1]
                year_digit = '4' if year_digit > '4' else year_digit
                years.append(year_digit)
            elif len(code) >= 4 and code[1].isdigit():
                year_digit = code[1]
                year_digit = '4' if year_digit > '4' else year_digit
                years.append(year_digit)
        estimated_year = max(set(years), key=years.count) if years else data.get("estimated_year", "")
        estimated_year = str(estimated_year) if estimated_year is not None else ""
        offered_term=data.get("offered_term", "")
        source = data.get("source", "gpacalc")
        UserYearEstimate.objects.update_or_create(
            offered_term=data.get("offered_term", ""),
            user=user,
            session=session_key,
            defaults={
                "school": school,
                "estimated_year": estimated_year,
                "courses": courses,
                "source": source
            }
        )
        return JsonResponse({"status": "ok"})
    except Exception as e:
        log_error("Failed to log user year estimate", extra={"error": str(e), "data": data})
        return JsonResponse({"status": "error", "error": str(e)}, status=400)

# --- Decorator for logging API timing and errors ---
def log_api_timing(api_name=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            start = time.perf_counter()
            # Ensure session exists
            if not request.session.session_key:
                request.session.save()
            session_id = request.session.session_key
            try:
                response = view_func(request, *args, **kwargs)
                duration = time.perf_counter() - start
                user = getattr(request, "user", None)
                status_code = getattr(response, "status_code", None)
                
                ApiTimingLog.objects.create(
                    user=user if user and user.is_authenticated else None,
                    session_id=session_id,
                    path=request.path,
                    method=request.method,
                    api_name=api_name or view_func.__name__,
                    duration=duration,
                    status_code=status_code,
                    extra={
                        "query_params": request.GET.dict(),
                        "body": request.body.decode(errors="ignore") if request.method in ["POST", "PUT"] else "",
                    }
                )
                
                log_info(
                    f"API '{api_name or view_func.__name__}' processed in {duration:.3f}s",
                    extra={
                        "user": str(user),
                        "session_id": session_id,
                        "path": request.path,
                        "method": request.method,
                        "duration": duration,
                        "status_code": status_code,
                    }
                )
                return response
                
            except Exception as e:
                duration = time.perf_counter() - start
                user = getattr(request, "user", None)
                
                ApiTimingLog.objects.create(
                    user=user if user and user.is_authenticated else None,
                    session_id=session_id,
                    path=request.path,
                    method=request.method,
                    api_name=api_name or view_func.__name__,
                    duration=duration,
                    status_code=None,
                    extra={
                        "error": str(e),
                        "traceback": traceback.format_exc(),
                        "query_params": request.GET.dict(),
                        "body": request.body.decode(errors="ignore") if request.method in ["POST", "PUT"] else "",
                    }
                )
                
                log_error(
                    f"Exception in API '{api_name or view_func.__name__}' after {duration:.3f}s: {e}",
                    extra={
                        "user": str(user),
                        "session_id": session_id,
                        "path": request.path,
                        "method": request.method,
                        "duration": duration,
                        "traceback": traceback.format_exc(),
                    }
                )
                raise
        return _wrapped_view
    return decorator

# --- Generic event logging endpoint ---
@csrf_exempt
@require_POST
@log_api_timing("log_event")
def log_event(request):
    try:
        data = json.loads(request.body)
        event_type = data.get("event_type")
        payload = data.get("payload", {})
        user = request.user if request.user.is_authenticated else None
        log_info(
            f"Event: {event_type}",
            extra={
                "user": str(user) if user else "anonymous",
                "payload": payload,
                "path": request.path,
                "method": request.method,
            }
        )
        return JsonResponse({"status": "ok"})
    except Exception as e:
        log_error("Failed to log event", extra={"error": str(e), "data": data})
        return JsonResponse({"status": "error", "error": str(e)}, status=400)

# --- User action logging endpoint ---
@csrf_exempt
@require_POST
@log_api_timing("log_user_action")
def log_user_action(request):
    try:
        data = json.loads(request.body)
        action = data.get("action")
        details = data.get("details", {})
        user = request.user if request.user.is_authenticated else None
        log_info(
            f"User action: {action}",
            extra={
                "user": str(user) if user else "anonymous",
                "details": details,
                "path": request.path,
                "method": request.method,
            }
        )
        return JsonResponse({"status": "ok"})
    except Exception as e:
        log_error("Failed to log user action", extra={"error": str(e), "data": data})
        return JsonResponse({"status": "error", "error": str(e)}, status=400)

# --- API error logging endpoint (for frontend to report JS errors, etc.) ---
@csrf_exempt
@require_POST
def log_client_error(request):
    try:
        data = json.loads(request.body)
        error_message = data.get("error_message")
        stack = data.get("stack", "")
        user = request.user if request.user.is_authenticated else None
        log_error(
            f"Client error: {error_message}",
            extra={
                "user": str(user) if user else "anonymous",
                "stack": stack,
                "path": request.path,
                "method": request.method,
            }
        )
        return JsonResponse({"status": "ok"})
    except Exception as e:
        log_error("Failed to log client error", extra={"error": str(e)})
        return JsonResponse({"status": "error", "error": str(e)}, status=400)
