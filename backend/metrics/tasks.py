from celery import shared_task
from metrics.models import ApiTimingLog, EstimateUserYear
import json
from collections import Counter

@shared_task(bind=True, serializer='json')
def log_api_metrics(self, data):
    try:
        ApiTimingLog.objects.create(
            user_id=data.get("user_id"),
            session_id=data.get("session_id"),
            path=data.get("path"),
            method=data.get("method"),
            api_name=data.get("api_name"),
            duration=data.get("duration"),
            status_code=data.get("status_code"),
            extra={
                "query_params": data.get("query_params", {}),
                # Remove body or add size limits
            }
        )
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)

@shared_task(bind=True)
def estimate_user_year(self, request_data):
    try:
        print("Received request data in estimate_user_year:", request_data)
        payload = json.loads(request_data)
        course_list = payload.get("courses", [])

        # Step 1: Normalize course identifiers
        course_keys = [
            f"{course.get('course_type', '')}-{course.get('course_code', '')}"
            for course in course_list
        ]

        # Step 2: Find the most common course
        if course_keys:
            most_common_course = Counter(course_keys).most_common(1)[0][0]
        else:
            most_common_course = None

        # Step 3: Get most common first digit of course codes
        course_codes = [str(course.get("course_code", "")) for course in course_list if course.get("course_code")]
        first_digits = [int(code[0]) for code in course_codes if code and code[0].isdigit()]
        most_common_first_digit = Counter(first_digits).most_common(1)[0][0] if first_digits else None

        if most_common_first_digit and payload.get("user_id"):
            EstimateUserYear.objects.update_or_create(
                user_id=payload.get("user_id"),
                session_id=payload.get("session_id"),
                defaults={
                    'year': most_common_first_digit,
                    'school': most_common_course
                }
            )
            print(f"Successfully saved user year estimate: {most_common_first_digit}")
        
        return {"status": "success", "year": most_common_first_digit}
        
    except Exception as e:
        print(f"Error in estimate_user_year task: {e}")
        return {"status": "error", "detail": str(e)}
