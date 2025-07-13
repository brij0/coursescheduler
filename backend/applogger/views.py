from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.http import JsonResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
import json
from django.db import models
import datetime
from .models import  AppSession, UserYearEstimate, CoursetypetoSchool
from .utils import log_info, log_error
from django.views.decorators.http import require_http_methods
@csrf_exempt
@require_http_methods(["GET", "POST"])
def log_app_activity(request, app_name, section_name):
    section_name = section_name
    session_id = request.session.session_key if request.session.session_key else request.session.save()
    user = request.user if request.user.is_authenticated else None
    now = timezone.now()
    print(f"Logging app activity for user: {user}, app: {app_name}, section: {section_name}, session_id: {session_id}")
    try:
        obj, created = AppSession.objects.get_or_create(
            user=user,
            section_name=section_name,
            app_name=app_name,
            session_id=session_id,
            defaults={'start_time': now, 'last_api_call_time': now}
        )
        print(f"already exists: {obj}") if obj else print(f"created new session: {obj.session_id} for user: {user}, app: {app_name}, section: {section_name}")
        if not created:
            obj.last_api_call_time = now
            print(f"Updating existing session: {obj.session_id} for user: {user}, app: {app_name}, section: {section_name}")
            # Save duration in seconds
            duration_seconds = (now - obj.start_time).total_seconds()
            obj.duration = datetime.timedelta(seconds=duration_seconds)
            obj.save()
    except Exception as e:
        log_error("Failed to log app activity", extra={"error": str(e), "app_name": app_name, "section_name": section_name, "user": user})
        return JsonResponse({"status": "error", "error": str(e)}, status=500)
@csrf_exempt
@require_POST
def log_user_year_estimate(request):
    try:
        data = json.loads(request.body)
        # print(f"Received data for user year estimate: {data}")
        # Get user or session key for anonymous users
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
            # print(f"Anonymous user session key: {session_key}")
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
                # print(f"Found year digit {year_digit} in course code {code}")
                years.append(year_digit)
            elif len(code) >= 4 and code[1].isdigit():
                year_digit = code[1]
                year_digit = '4' if year_digit > '4' else year_digit
                # print(f"Found year digit {year_digit} in course code {code}")
                years.append(year_digit)
            elif len(code) >= 4 and code[1].isdigit():
                year_digit = code[1]
                year_digit = '4' if year_digit > '4' else year_digit
                # print(f"Found year digit {year_digit} in course code {code}")
                years.append(year_digit)
        estimated_year = max(set(years), key=years.count) if years else data.get("estimated_year", "")
        estimated_year = str(estimated_year) if estimated_year is not None else ""
        offered_term=data.get("offered_term", "")
        # print(f"Logging user year estimate: {user}, school: {school}, estimated_year: {estimated_year}, courses: {courses}, offered_term: {offered_term}")
        source = data.get("source", "gpacalc")
        # print(f"Logging user year estimate: {user}, school: {school}, estimated_year: {estimated_year}, courses: {courses}, source: {source}")
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

# @require_GET
# @login_required
# def analytics_dashboard(request):
#     # Example: total clicks, section views, year estimates
#     clicks = AppSession.objects.count()
#     section_views = SectionView.objects.count()
#     year_counts = (
#         UserYearEstimate.objects.values("estimated_year")
#         .order_by("estimated_year")
#         .annotate(count=models.Count("id"))
#     )
#     return JsonResponse({
#         "total_clicks": clicks,
#         "total_section_views": section_views,
#         "year_estimates": list(year_counts),
#     })