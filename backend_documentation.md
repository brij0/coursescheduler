# Backend API Documentation

## Overview

This document provides comprehensive documentation for the Django backend API, covering three main applications:
- **CoopForum**: Discussion forum with posts, comments, and voting
- **Scheduler**: Course scheduling and conflict resolution
- **GPACalc**: GPA calculation system

## Base URL Structure

```
/api/coopforum/     # CoopForum API endpoints
/api/scheduler/     # Scheduler API endpoints  
/api/gpacalc/       # GPA Calculator API endpoints
/api/auth/          # Authentication endpoints
```

## Authentication

### Overview
- Uses Django session-based authentication
- All CoopForum endpoints require authentication
- Some scheduler endpoints are publicly accessible

### Login
**POST** `/api/auth/login/`

**Request Body:**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400`: Missing username/password or invalid JSON
- `401`: Invalid credentials

### Logout
**POST** `/api/auth/logout/`

**Request Body:** None

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User
**GET** `/api/auth/user/`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  }
}
```

**Error Response:**
- `401`: User not authenticated

---

## CoopForum API

### Posts

#### List Posts
**GET** `/api/coopforum/posts/`

**Query Parameters:**
- `page`: Page number (optional)
- `page_size`: Items per page (optional)

**Response (200):**
```json
{
  "count": 25,
  "next": "http://example.com/api/coopforum/posts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "user123"
      },
      "title": "Job Review: Software Developer at Company X",
      "content": "Here's my experience...",
      "job_id": "12345",
      "job_term": "Fall 2024",
      "job_title": "Software Developer",
      "organization": "Company X",
      "job_location": "Toronto, ON",
      "score": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_deleted": false
    }
  ]
}
```

#### Create Post
**POST** `/api/coopforum/posts/`

**Request Body:**
```json
{
  "title": "Job Review: Software Developer at Company X",
  "content": "Here's my detailed experience...",
  "job_id": "12345",
  "job_term": "Fall 2024",
  "job_title": "Software Developer",
  "organization": "Company X",
  "job_location": "Toronto, ON"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "user123"
  },
  "title": "Job Review: Software Developer at Company X",
  "content": "Here's my detailed experience...",
  "job_id": "12345",
  "job_term": "Fall 2024",
  "job_title": "Software Developer",
  "organization": "Company X",
  "job_location": "Toronto, ON",
  "score": 0,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "is_deleted": false
}
```

#### Get Post Details
**GET** `/api/coopforum/posts/{id}/`

**Response (200):** Same as individual post object above

#### Update Post
**PUT/PATCH** `/api/coopforum/posts/{id}/`

**Request Body:** Same as create post (PUT requires all fields, PATCH allows partial updates)

**Response (200):** Updated post object

#### Delete Post
**DELETE** `/api/coopforum/posts/{id}/`

**Response (204):** No content (soft delete - sets `is_deleted=True`)

#### Vote on Post
**POST** `/api/coopforum/posts/{id}/vote/`

**Request Body:**
```json
{
  "value": 1    // 1 for upvote, -1 for downvote
}
```

**Response (200):**
```json
{
  "message": "Vote created"    // or "Vote updated" or "Vote removed"
}
```

**Error Response:**
- `400`: Invalid value (must be 1 or -1)

#### Get Post Comments
**GET** `/api/coopforum/posts/{id}/comments/`

**Response (200):**
```json
[
  {
    "id": 1,
    "user": {
      "id": 2,
      "username": "commenter123"
    },
    "post": 1,
    "content": "Great review! Thanks for sharing.",
    "parent": null,
    "children": [
      {
        "id": 2,
        "user": {
          "id": 1,
          "username": "user123"
        },
        "post": 1,
        "content": "Thanks!",
        "parent": 1,
        "children": [],
        "score": 0,
        "created_at": "2024-01-15T11:00:00Z",
        "updated_at": "2024-01-15T11:00:00Z",
        "is_deleted": false
      }
    ],
    "score": 2,
    "created_at": "2024-01-15T10:45:00Z",
    "updated_at": "2024-01-15T10:45:00Z",
    "is_deleted": false
  }
]
```

#### Search Posts
**GET** `/api/coopforum/posts/search/?q=search_term`

**Query Parameters:**
- `q`: Search query (required)

**Response (200):**
```json
{
  "query": "software developer",
  "count": 5,
  "results": [
    // Array of post objects matching search criteria
  ]
}
```

**Error Response:**
- `400`: Missing search query

### Comments

#### Create Comment
**POST** `/api/coopforum/comments/`

**Request Body:**
```json
{
  "post": 1,
  "content": "Great post!",
  "parent": null    // Optional: ID of parent comment for replies
}
```

**Response (201):**
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "username": "commenter123"
  },
  "post": 1,
  "content": "Great post!",
  "parent": null,
  "children": [],
  "score": 0,
  "created_at": "2024-01-15T10:45:00Z",
  "updated_at": "2024-01-15T10:45:00Z",
  "is_deleted": false
}
```

#### Vote on Comment
**POST** `/api/coopforum/comments/{id}/vote/`

**Request Body:**
```json
{
  "value": 1    // 1 for upvote, -1 for downvote
}
```

**Response (200):**
```json
{
  "message": "Vote created"    // or "Vote updated" or "Vote removed"
}
```

---

## Scheduler API

### Course Data

#### Get Course Types
**GET** `/api/scheduler/course_types/`

**Response (200):**
```json
["CIS", "ENGG", "MATH", "PHYS"]
```

#### Get Course Codes
**POST** `/api/scheduler/get_course_codes/`

**Request Body:**
```json
{
  "course_type": "CIS"
}
```

**Response (200):**
```json
["1000", "1500", "2750", "3750"]
```

**Error Response:**
- `400`: Missing course_type or invalid JSON

#### Get Section Numbers
**POST** `/api/scheduler/get_section_numbers/`

**Request Body:**
```json
{
  "course_type": "CIS",
  "course_code": "2750"
}
```

**Response (200):**
```json
["01", "02", "03", "DE"]
```

**Error Response:**
- `400`: Missing course_type/course_code or invalid JSON

### Course Search

#### Search Courses
**POST** `/api/scheduler/search/`

**Request Body (Form Data):**
```
course_type_0=CIS
course_code_0=2750
section_number_0=01
course_type_1=MATH
course_code_1=1200
section_number_1=01
```

**Response (200):**
```json
{
  "events": {
    "CIS*2750*01": [
      {
        "event_type": "Lecture",
        "event_date": "2024-01-15",
        "days": "MWF",
        "time": "9:30 AM - 10:20 AM",
        "location": "MCKN 227",
        "description": "Course lecture",
        "weightage": null
      },
      {
        "event_type": "Midterm",
        "event_date": "2024-02-15",
        "days": "TBD",
        "time": "TBD",
        "location": "TBD",
        "description": "Midterm examination",
        "weightage": "30%"
      }
    ]
  }
}
```

### Conflict-Free Scheduling

#### Generate Conflict-Free Schedule
**POST** `/api/scheduler/conflict_free_schedule/`

**Request Body:**
```json
{
  "courses": [
    {
      "course_type": "CIS",
      "course_code": "2750"
    },
    {
      "course_type": "MATH",
      "course_code": "1200"
    }
  ],
  "offset": 0,
  "limit": 100
}
```

**Response (200):**
```json
{
  "schedules": [
    {
      "CIS*2750*01": [
        {
          "event_type": "Lecture",
          "times": "MWF, 9:30 AM - 10:20 AM",
          "location": "MCKN 227"
        }
      ],
      "MATH*1200*01": [
        {
          "event_type": "Lecture", 
          "times": "TTh, 11:30 AM - 12:50 PM",
          "location": "MCKN 132"
        }
      ]
    }
  ],
  "total": 15,
  "offset": 0,
  "limit": 100,
  "message": "Showing 1 of 15 conflict-free schedules"
}
```

**Error Response:**
- `400`: No conflict-free schedule possible

### Calendar Integration

#### Add to Calendar
**GET** `/api/scheduler/add_to_calendar/`

Redirects to Google OAuth if not authenticated, then to insert_events endpoint.

#### Insert Events to Calendar
**GET** `/api/scheduler/insert_events/`

**Response (200):**
```json
{
  "message": "Events added to calendar successfully"
}
```

**Error Responses:**
- `401`: Google authentication required
- `500`: Failed to add events

### Utilities

#### Submit Suggestion
**POST** `/api/scheduler/submit_suggestion/`

**Request Body:**
```json
{
  "suggestion": "Please add more course sections for popular classes"
}
```

**Response (200):**
```json
{
  "message": "Thank you for your feedback!"
}
```

#### Upload Course Outline
**POST** `/api/scheduler/upload_course_outline/`

**Request Body (Form Data):**
```
course_type=CIS
course_code=2750
course_outline=<PDF file>
```

**Response (200):**
```json
{
  "message": "File uploaded successfully"
}
```

**Error Response:**
- `400`: All fields are required

---

## GPA Calculator API

### Course Selection

#### Get Course Codes
**POST** `/api/gpacalc/course_codes/`

**Request Body:**
```json
{
  "course_type": "CIS"
}
```

**Response (200):**
```json
["1000", "1500", "2750", "3750"]
```

#### Get Section Numbers
**POST** `/api/gpacalc/section_numbers/`

**Request Body:**
```json
{
  "course_type": "CIS",
  "course_code": "2750"
}
```

**Response (200):**
```json
["01", "02", "03", "DE"]
```

#### Get Course Events
**POST** `/api/gpacalc/course_events/`

**Request Body:**
```json
{
  "course_type": "CIS",
  "course_code": "2750",
  "section_number": "01"
}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "event_type": "Assignment 1",
    "weightage": "15%"
  },
  {
    "id": 2,
    "event_type": "Midterm",
    "weightage": "30%"
  },
  {
    "id": 3,
    "event_type": "Final Exam",
    "weightage": "40%"
  },
  {
    "id": 4,
    "event_type": "Labs",
    "weightage": "15%"
  }
]
```

### GPA Calculation

#### Calculate GPA
**POST** `/api/gpacalc/calculate/`

**Request Body:**
```json
{
  "courses": [
    {
      "course_type": "CIS",
      "course_code": "2750",
      "section_number": "01",
      "credits": 0.5,
      "assessments": [
        {
          "event_id": 1,
          "achieved": 85.0
        },
        {
          "event_id": 2,
          "achieved": 78.5
        },
        {
          "event_id": 3,
          "achieved": 92.0
        },
        {
          "event_id": 4,
          "achieved": 88.0
        }
      ]
    }
  ]
}
```

**Response (200):**
```json
{
  "per_course": [
    {
      "course": "CIS*2750*01",
      "final_percentage": 85.75,
      "letter_grade": "A",
      "gpa_value": 4.0,
      "credits": 0.5
    }
  ],
  "overall_gpa": 4.0,
  "overall_final_percentage": 85.75
}
```

---

## Data Models

### CoopForum Models

#### Post
```python
{
  "id": int,
  "user": User,
  "title": str (max 255 chars),
  "content": str,
  "job_id": str (max 100 chars, optional),
  "job_term": str (max 100 chars, optional),
  "job_title": str (max 255 chars, optional),
  "organization": str (max 255 chars, optional),
  "job_location": str (max 255 chars, optional),
  "score": int (calculated from votes),
  "is_deleted": bool,
  "deleted_at": datetime (optional),
  "created_at": datetime,
  "updated_at": datetime
}
```

#### Comment
```python
{
  "id": int,
  "user": User,
  "post": Post,
  "content": str,
  "parent": Comment (optional, for nested replies),
  "children": [Comment] (nested comments),
  "score": int (calculated from votes),
  "is_deleted": bool,
  "deleted_at": datetime (optional),
  "created_at": datetime,
  "updated_at": datetime
}
```

#### Vote
```python
{
  "id": int,
  "user": User,
  "content_type": ContentType,
  "object_id": int,
  "value": int (1 for upvote, -1 for downvote),
  "created_at": datetime,
  "updated_at": datetime
}
```

### Scheduler Models

#### Course
```python
{
  "course_id": int,
  "course_type": str (max 20 chars),
  "course_code": str (max 20 chars),
  "section_number": str (max 20 chars),
  "section_name": str (max 50 chars),
  "seats": str (max 50 chars),
  "instructor": str (max 50 chars)
}
```

#### CourseEvent
```python
{
  "id": int,
  "course": Course,
  "event_type": str (max 50 chars),
  "event_date": date (optional),
  "start_date": date (optional),
  "end_date": date (optional),
  "days": str (max 100 chars),
  "time": str (max 50 chars),
  "location": str (max 255 chars),
  "description": str,
  "weightage": str (max 50 chars, optional)
}
```

### GPA Calculator Models

#### CourseGrade
```python
{
  "id": int,
  "course": Course,
  "credits": decimal,
  "final_percentage": decimal (optional),
  "letter_grade": str (max 5 chars, optional),
  "gpa_value": decimal (optional)
}
```

#### AssessmentGrade
```python
{
  "id": int,
  "course_grade": CourseGrade,
  "course_event": CourseEvent,
  "weightage": decimal,
  "achieved_percentage": decimal
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Descriptive error message"
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Frontend Integration Notes

### Authentication Flow
1. Check user authentication status with `GET /api/auth/user/`
2. If not authenticated, redirect to login
3. Store user info in frontend state/context
4. Include session cookies in all subsequent requests

### CoopForum Integration
1. Use pagination for post lists
2. Implement real-time score updates after voting
3. Handle nested comment rendering with proper indentation
4. Implement search with debouncing for better UX

### Scheduler Integration
1. Cache course type/code/section data to reduce API calls
2. Implement loading states for conflict-free schedule generation
3. Handle pagination for large result sets
4. Store search results in session for calendar integration

### GPA Calculator Integration
1. Build dynamic forms based on course events
2. Validate grade inputs before submission
3. Display real-time GPA calculations
4. Handle missing weightage gracefully

### Best Practices
1. Always handle loading states
2. Implement proper error handling and user feedback
3. Use optimistic updates where appropriate
4. Cache frequently accessed data
5. Implement proper form validation
6. Handle network errors gracefully

---

## Development Notes

### Database Configuration
- Uses SQLite for development
- PostgreSQL recommended for production
- Includes proper indexing for performance

### Security Features
- CSRF protection on state-changing endpoints
- Authentication required for sensitive operations
- Soft deletes to maintain data integrity
- Input validation and sanitization

### Performance Considerations
- Efficient queries with proper joins
- Pagination for large datasets
- Caching for frequently accessed data
- Optimized conflict detection algorithm

### Testing
- Unit tests for all model methods
- Integration tests for API endpoints
- Performance tests for complex operations
- Error handling tests for edge cases