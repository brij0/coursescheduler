import {
    getCookie
} from "../utils/getcookies"; 

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

const api = {
    // Scheduler Endpoints
    fetchOfferedTerms: async (hasEvents = false) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/offered_terms/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    has_events: hasEvents
                }),
            }
        );
        return response.json();
    },

    fetchCourseTypes: async (term, hasEvents = false) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/course_types/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    offered_term: term,
                    has_events: hasEvents
                }),
            }
        );
        return response.json();
    },

    fetchCourseCodes: async (term, courseType, hasEvents = false) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/course_codes/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    offered_term: term,
                    course_type: courseType,
                    has_events: hasEvents,
                }),
            }
        );
        return response.json();
    },

    fetchSectionNumbers: async (term, courseType, courseCode, hasEvents = false) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/section_numbers/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    offered_term: term,
                    course_type: courseType,
                    course_code: courseCode,
                    has_events: hasEvents,
                }),
            }
        );
        return response.json();
    },

    generateSchedules: async (courses, term, offset = 0, limit = 50) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/conflict_free_schedule/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || "",
                },
                credentials: "include",
                body: JSON.stringify({
                    courses,
                    offered_term: term,
                    offset,
                    limit
                }),
            }
        );
        return response.json();
    },

    submitSuggestion: async (suggestion) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/submit_suggestion/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || "",
                },
                credentials: "include",
                body: JSON.stringify({
                    suggestion
                }),
            }
        );
        return response;
    },

    fetchCourseEvents: async (sections) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/course_events_schedule/`, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    sections
                }),
            }
        );
        return response;
    },

    exportEvents: async (events) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/scheduler/export_events/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(events),
            }
        );
        return response;
    },

    // Coop Forum Endpoints
    fetchPosts: async () => {
        const response = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/`, {
            credentials: "include",
        });
        return response.json();
    },

    fetchPostById: async (postId) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/posts/${postId}/`, {
                credentials: "include",
            }
        );
        return response.json();
    },

    createPost: async (postData) => {
        const response = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(postData),
        });
        return response.json();
    },

    voteOnPost: async (postId, value) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/posts/${postId}/vote/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                    value
                }),
            }
        );
        return response.json();
    },

    searchPosts: async (query) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/posts/search/?q=${encodeURIComponent(
        query
      )}`, {
        headers:{
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
            }
        );
        return response.json();
    },

    updatePost: async (postId, postData) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/posts/${postId}/`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify(postData),
            }
        );
        return response.json();
    },

    deletePost: async (postId) => {
        await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${postId}/`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
        });
    },

    // Comments Endpoints
    fetchCommentsForPost: async (postId) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/posts/${postId}/comments/`, {
                credentials: "include",
            }
        );
        return response.json();
    },

    createComment: async (commentData) => {
        const response = await fetch(`${BACKEND_API_URL}/api/coopforum/comments/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(commentData),
        });
        return response.json();
    },

    updateComment: async (commentId, commentData) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/comments/${commentId}/`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify(commentData),
            }
        );
        return response.json();
    },

    deleteComment: async (commentId) => {
        await fetch(`${BACKEND_API_URL}/api/coopforum/comments/${commentId}/`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            },
        });
    },

    voteOnComment: async (commentId, value) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/coopforum/comments/${commentId}/vote/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                    value
                }),
            }
        );
        return response.json();
    },

    // GPA Calculator Endpoints

    fetchGpaCourseEvents: async (term, courseType, courseCode, sectionNumber) => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/gpacalc/course_events/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    offered_term: term,
                    course_type: courseType,
                    course_code: courseCode,
                    section_number: sectionNumber,
                }),
            }
        );
        return response.json();
    },

    calculateGpa: async (payload) => {
        const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/calculate/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    fetchUserProgress: async () => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/gpacalc/user_progress/`, {
                credentials: "include",
            }
        );
        return response.json();
    },

    exportGpaToExcel: async () => {
        const response = await fetch(
            `${BACKEND_API_URL}/api/gpacalc/progress_export_excel/`, {
                credentials: "include",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                },
            }
        );
        return response.blob();
    },

    // Metrics Endpoint
    fetchMetrics: async () => {
        const response = await fetch(`${BACKEND_API_URL}/api/metrics/`,
        {
            credentials: "include",
        });
        return response.json();
    },
};

export default api;
