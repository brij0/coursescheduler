import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from applogger.utils import log_info, log_error
from applogger.views import log_user_year_estimate, log_app_activity
from scheduler.models import Course, CourseEvent
from .models import CourseGrade, AssessmentGrade, GpaCalcProgress
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from io import BytesIO

app_name = "GPA-Calculator"
section_name = "Index"

@require_GET
def index(request):
    """
    API: Get available terms for GPA calculator
    
    Returns:
        JSON: {
            "terms": ["Term1", "Term2", ...],
            "progress_data": {...} (if user is authenticated)
        }
    
    Frontend usage:
    - Call on initial load to get available terms
    - If user is logged in, returns saved progress data to prefill the form
    """
    log_app_activity(request, app_name, section_name)
    log_info("GPA index page accessed", extra={"user": str(request.user)})
    
    terms = (
        Course.objects
        .filter(events__isnull=False)
        .values_list("offered_term", flat=True)
        .distinct()
        .order_by("offered_term")
    )
    
    # Get saved progress for authenticated users
    progress_data = None
    if request.user.is_authenticated:
        try:
            progress = GpaCalcProgress.objects.get(user=request.user)
            progress_data = progress.data
        except GpaCalcProgress.DoesNotExist:
            pass
    
    return JsonResponse({
        "terms": list(terms),
        "progress_data": progress_data
    })

@require_GET
def get_offered_terms(request):
    """
    API: Get all available terms
    
    Returns:
        JSON: Array of term strings ["Fall 2025", "Winter 2026", ...]
    
    Frontend usage:
    - Call to populate term dropdown in UI
    """
    log_app_activity(request, app_name, section_name)
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
    """
    API: Get course types for a given term
    
    Request:
        JSON: {"offered_term": "Fall 2025"}
    
    Returns:
        JSON: Array of course types ["CS", "MATH", ...]
    
    Frontend usage:
    - Call when user selects a term to populate the course type dropdown
    """
    log_app_activity(request, app_name, section_name)
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

@require_POST
@csrf_exempt
def get_course_codes(request):
    """
    API: Get course codes for a given course type and term
    
    Request:
        JSON: {
            "course_type": "CS",
            "offered_term": "Fall 2025"
        }
    
    Returns:
        JSON: Array of course codes ["101", "202", ...]
    
    Frontend usage:
    - Call when user selects a course type to populate the course code dropdown
    """
    log_app_activity(request, app_name, section_name)
    data = json.loads(request.body)
    cterm = data.get("offered_term")
    ctype = data.get("course_type")
    codes = (
        Course.objects
        .filter(course_type=ctype, offered_term=cterm, events__isnull=False)
        .values_list("course_code", flat=True)
        .distinct()
        .order_by("course_code")
    )
    return JsonResponse(list(codes), safe=False)

@require_POST
@csrf_exempt
def get_section_numbers(request):
    """
    API: Get section numbers for a given course type, code, and term
    
    Request:
        JSON: {
            "course_type": "CS",
            "course_code": "101",
            "offered_term": "Fall 2025"
        }
    
    Returns:
        JSON: Array of section numbers ["001", "002", ...]
    
    Frontend usage:
    - Call when user selects a course code to populate the section dropdown
    """
    log_app_activity(request, app_name, section_name)
    data = json.loads(request.body)
    ctype = data.get("course_type")
    ccode = data.get("course_code")
    cterm = data.get("offered_term")
    secs = (
        Course.objects
        .filter(course_type=ctype, offered_term=cterm, course_code=ccode, events__isnull=False)
        .values_list("section_number", flat=True)
        .distinct()
        .order_by("section_number")
    )
    return JsonResponse(list(secs), safe=False)

@require_POST
@csrf_exempt
def get_course_events(request):
    """
    API: Get assessment events for a specific course section
    
    Request:
        JSON: {
            "course_type": "CS",
            "course_code": "101",
            "section_number": "001",
            "offered_term": "Fall 2025"
        }
    
    Returns:
        JSON: Array of event objects
        [
            {
                "id": 12,
                "event_type": "Midterm",
                "weightage": "30"
            },
            ...
        ]
    
    Frontend usage:
    - Call when user selects a section to display assessment components
    - Display each event with its weight and an input field for the achieved grade
    - Store the event_id with each input field to submit with calculations
    """
    log_app_activity(request, app_name, section_name)
    data = json.loads(request.body)
    ctype = data.get("course_type")
    code = data.get("course_code")
    csn = data.get("section_number")
    cterm = data.get("offered_term")
    user = request.user if request.user.is_authenticated else None
    evs = CourseEvent.objects.filter(
        course__course_type=ctype,
        course__course_code=code,
        course__section_number=csn,
        course__offered_term=cterm
    ).values("id", "event_type", "weightage")
    return JsonResponse(list(evs), safe=False)

@require_POST
def calculate_gpa(request):
    """
    API: Calculate GPA based on course selections and grades
    
    Request:
        JSON: {
            "offered_term": "Fall 2025",
            "courses": [
                {
                    "course_type": "CS",
                    "course_code": "101",
                    "section_number": "001",
                    "assessments": [
                        {"event_id": 12, "achieved": 87.5},
                        ...
                    ]
                },
                ...
            ]
        }
    
    Returns:
        JSON: {
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
            "overall_final_percentage": 82.5,
            "total_credit": 2.5,
            "courses": [...], // Cleaned course data
            "offered_term": "Fall 2025"
        }
    
    Frontend usage:
    - Call after user enters all grades to calculate GPA
    - Display the overall GPA and per-course breakdown
    - For logged-in users, this data is automatically saved
    """
    log_app_activity(request, app_name, section_name)
    payload = json.loads(request.body)
    log_user_year_estimate(request)
    
    offered_term = payload.get("offered_term")
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
            section_number=c["section_number"],
            offered_term=offered_term,
        )
        
        cg = CourseGrade.objects.create(
            course=course_obj,
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
            "credits": float(cg.course.credits)
        })
        
        if cg.gpa_value is not None:
            total_points += float(cg.gpa_value) * float(cg.course.credits)
            total_credit += float(cg.course.credits)
        if cg.final_percentage is not None:
            total_weighted_percentage += float(cg.final_percentage) * float(cg.course.credits)
            total_credits_for_percentage += float(cg.course.credits)

    overall_gpa = round(total_points / total_credit, 2) if total_credit else 0
    overall_final_percentage = (
        round(total_weighted_percentage / total_credits_for_percentage, 2)
        if total_credits_for_percentage else 0
    )
    
    # Clean up course data for storage
    clean_courses = []
    for course in payload.get("courses", []):
        clean_assessments = []
        for a in course.get("assessments", []):
            clean_assessments.append({
                "event_id": int(a.get("event_id")) if a.get("event_id") is not None else None,
                "achieved": float(a.get("achieved")) if a.get("achieved") is not None else None,
            })
        clean_courses.append({
            "course_type": course.get("course_type", ""),
            "course_code": course.get("course_code", ""),
            "section_number": course.get("section_number", ""),
            "assessments": clean_assessments,
        })

    result_data = {
        "per_course": results,
        "overall_gpa": float(overall_gpa),
        "overall_final_percentage": float(overall_final_percentage),
        "total_credit": float(total_credit),
        "courses": clean_courses,
        "offered_term": payload.get("offered_term", ""),
    }
    
    # Save progress for logged-in users or by session
    if request.user.is_authenticated:
        GpaCalcProgress.objects.update_or_create(
            user=request.user,
            defaults={'data': result_data}
        )
    else:
        request.session['gpacalc_progress'] = result_data
    
    return JsonResponse(result_data)

@require_GET
@csrf_exempt
def progress_export_excel(request):
    """
    API: Export GPA calculation results to Excel file
    
    Request: GET request (no parameters needed)
    
    Returns:
        Excel file as attachment with the following sheets:
        - Overall GPA: Summary with overall GPA and per-course breakdown
        - Per-course sheets: One sheet per course with assessment details
    
    Frontend usage:
    - Provide an "Export to Excel" button that links to this endpoint
    - Uses the saved progress data (for logged-in users) or session data
    """
    section_name = "Excel Export"
    log_app_activity(request, app_name, section_name)
    
    # Get saved data
    if request.user.is_authenticated:
        try:
            progress = GpaCalcProgress.objects.get(user=request.user)
            data = progress.data
        except GpaCalcProgress.DoesNotExist:
            data = {}
    else:
        data = request.session.get('gpacalc_progress', {})
    
    # Create workbook
    wb = Workbook()
    wb.remove(wb.active)

    # 1. Add Overall GPA Sheet
    overall_gpa = data.get('overall_gpa', '')
    overall_final_percentage = data.get('overall_final_percentage', '')
    total_credit = data.get('total_credit', '')
    per_course = data.get('per_course', [])

    ws_summary = wb.create_sheet(title="Overall GPA")
    ws_summary.append(["Overall GPA", overall_gpa if overall_gpa != '' else None])
    ws_summary.append(["Overall Final %", overall_final_percentage if overall_final_percentage != '' else None])
    ws_summary.append(["Total Credits", total_credit if total_credit != '' else None])
    ws_summary.append([])  # Blank row
    ws_summary.append(["Course", "Final %", "Letter Grade", "GPA Value", "Credits"])
    for c in per_course:
        ws_summary.append([
            c.get("course", ""),
            c.get("final_percentage", None) if c.get("final_percentage", "") != "" else None,
            c.get("letter_grade", ""),
            c.get("gpa_value", None) if c.get("gpa_value", "") != "" else None,
            c.get("credits", None) if c.get("credits", "") != "" else None,
        ])
    for col in range(1, 6):
        ws_summary.column_dimensions[get_column_letter(col)].width = 18

    # 2. Add per-course sheets with assessment details
    for course in data.get('courses', []):
        sheet_name = f"{course.get('course_type', '')}-{course.get('course_code', '')}-{course.get('section_number', '')}"
        ws = wb.create_sheet(title=sheet_name[:31])
        ws.append(['Term', 'Assignment', 'Date', 'Weightage', 'Achieved', 'Achieved %'])

        for assessment in course.get('assessments', []):
            event_id = assessment.get('event_id', '')
            try:
                from scheduler.models import CourseEvent
                event = CourseEvent.objects.get(id=event_id)
                description = event.event_type
                event_date = event.event_date
                weightage = event.weightage
            except Exception:
                description = ''
                event_date = ''
                weightage = ''
            achieved = assessment.get('achieved', '')
            # Convert weightage to float if possible
            try:
                weightage_val = float(str(weightage).strip('%')) if weightage not in (None, '') else None
            except Exception:
                weightage_val = None
            # Achieved as float
            try:
                achieved_val = float(achieved) if achieved not in (None, '') else None
            except Exception:
                achieved_val = None
            # Achieved % as float (not string)
            try:
                achieved_pct = (achieved_val / 100 * weightage_val) if achieved_val is not None and weightage_val is not None else None
            except Exception:
                achieved_pct = None
            ws.append([
                data.get('offered_term', ''),
                description,
                event_date,
                weightage_val,
                achieved_val,
                achieved_pct
            ])
        # Set percentage format for Achieved % column
        for row in ws.iter_rows(min_row=2, min_col=6, max_col=6):
            for cell in row:
                cell.number_format = '0.00%'
                if cell.value is not None:
                    cell.value = cell.value / 100 if cell.value > 1 else cell.value  # Ensure value is in 0-1 range

        for col in range(1, 7):
            ws.column_dimensions[get_column_letter(col)].width = 18
    
    # Generate file response
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    response = HttpResponse(
        output,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="gpacalc_progress.xlsx"'
    return response