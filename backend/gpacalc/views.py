import json
from django.shortcuts   import render
from django.http        import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt

from backend.scheduler.models import Course, CourseEvent
from .models          import CourseGrade, AssessmentGrade

@require_GET
def index(request):
    """
    Renders the GPA calculator page.
    Context:
        course_types: List of available course types for dropdown.
    Usage (frontend):
        - Use course_types to populate the first dropdown for course selection.
    """
    course_types = (
        Course.objects
        .filter(events__isnull=False)
        .values_list("course_type", flat=True)
        .distinct()
        .order_by("course_type")
    )
    return render(request, "gpacalc/index.html", {
        "course_types": course_types
    })

@require_POST
@csrf_exempt
def get_course_codes(request):
    """
    AJAX endpoint.
    Request: JSON { "course_type": "CS" }
    Response: JSON list of course codes for the given type, e.g. ["CS101", "CS201"]
    Usage (frontend):
        - Call when user selects a course type to populate the course code dropdown.
    """
    data = json.loads(request.body)
    ctype = data.get("course_type")
    codes = (
        Course.objects
        .filter(course_type=ctype, events__isnull=False)
        .values_list("course_code", flat=True)
        .distinct()
        .order_by("course_code")
    )
    return JsonResponse(list(codes), safe=False)

@require_POST
@csrf_exempt
def get_section_numbers(request):
    """
    AJAX endpoint.
    Request: JSON { "course_type": "CS", "course_code": "CS101" }
    Response: JSON list of section numbers for the given type+code, e.g. ["001", "002"]
    Usage (frontend):
        - Call when user selects a course code to populate the section dropdown.
    """
    data = json.loads(request.body)
    ctype = data.get("course_type")
    code  = data.get("course_code")
    secs = (
        Course.objects
        .filter(course_type=ctype, course_code=code, events__isnull=False)
        .values_list("section_number", flat=True)
        .distinct()
        .order_by("section_number")
    )
    return JsonResponse(list(secs), safe=False)

@require_POST
@csrf_exempt
def get_course_events(request):
    """
    AJAX endpoint.
    Request: JSON { "course_type": "...", "course_code": "...", "section_number": "..." }
    Response: JSON list of events for the course, e.g.
      [
        {"id": 12, "event_type": "Midterm", "weightage": "30"},
        ...
      ]
    Usage (frontend):
        - Call when user selects a section to show assessment rows for grade input.
    """
    data = json.loads(request.body)
    ctype = data.get("course_type")
    code  = data.get("course_code")
    sn    = data.get("section_number")
    evs = CourseEvent.objects.filter(
        course__course_type=ctype,
        course__course_code=code,
        course__section_number=sn
    ).values("id", "event_type", "weightage")
    return JsonResponse(list(evs), safe=False)

@require_POST
def calculate_gpa(request):
    """
    Main GPA calculation endpoint.
    Request: JSON
      {
        "courses": [
          {
            "course_type": "...",
            "course_code": "...",
            "section_number": "...",
            "assessments": [
              {"event_id": 12, "achieved": 87.5},
              ...
            ]
          },
          ...
        ]
      }
    Response: JSON
      {
        "per_course": [
          {
            "course": "CS101-001",
            "final_percentage": 85.0,
            "letter_grade": "A",
            "gpa_value": 4.0,
            "credits": 0.5
          },
          ...
        ],
        "overall_gpa": 3.7,
        "overall_final_percentage": 82.5
      }
    Usage (frontend):
        - Call after user enters all grades to get per-course and overall GPA.
    """
    payload = json.loads(request.body)
    results = []
    total_points = 0
    total_credit = 0
    total_weighted_percentage = 0
    total_credits_for_percentage = 0

    for c in payload.get("courses", []):
        # create CourseGrade
        course_obj = Course.objects.get(
            course_type=c["course_type"],
            course_code=c["course_code"],
            section_number=c["section_number"]
        )
        cg = CourseGrade.objects.create(
            course=course_obj,
            credits=c.get("credits", 1.0)
        )
        # for each assessment input
        for a in c.get("assessments", []):
            ev = CourseEvent.objects.get(id=a["event_id"])
            # Parse weightage to decimal (strip % if present)
            raw_weight = ev.weightage or 0
            if isinstance(raw_weight, str) and raw_weight.endswith("%"):
                raw_weight = raw_weight.rstrip("%")
            try:
                weight = float(raw_weight)
            except Exception:
                weight = 0
            AssessmentGrade.objects.create(
                course_grade=cg,
                course_event=ev,
                weightage=weight,
                achieved_percentage=a["achieved"]
            )
        # compute final & letter & gpa
        cg.calculate_from_assessments()
        results.append({
            "course": str(cg.course),
            "final_percentage": float(cg.final_percentage) if cg.final_percentage is not None else None,
            "letter_grade": cg.letter_grade,
            "gpa_value": float(cg.gpa_value) if cg.gpa_value is not None else None,
            "credits": float(cg.credits),
        })
        if cg.gpa_value is not None:
            total_points += float(cg.gpa_value) * float(cg.credits)
            total_credit += float(cg.credits)
        if cg.final_percentage is not None:
            total_weighted_percentage += float(cg.final_percentage) * float(cg.credits)
            total_credits_for_percentage += float(cg.credits)

    overall_gpa = round(total_points / total_credit, 2) if total_credit else 0
    overall_final_percentage = (
        round(total_weighted_percentage / total_credits_for_percentage, 2)
        if total_credits_for_percentage else 0
    )
    return JsonResponse({
        "per_course": results,
        "overall_gpa": overall_gpa,
        "overall_final_percentage": overall_final_percentage
    })
