import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Grid,
  List,
  Eye,
  Download,
  Users,
  Hash,
  Send,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// New Component for Monthly Calendar Grid (no changes needed here from previous iteration)
const MonthlyCalendarGrid = ({ courseEvents, courseColors }) => {
  const currentYear = new Date().getFullYear();

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  };

  const getMonthsWithEvents = () => {
    const monthsSet = new Set();
    
    Object.entries(courseEvents).forEach(([courseKey, events]) => {
      events
        .filter((event) => event.event_date)
        .forEach((event) => {
          const eventDate = formatEventDate(event.event_date);
          monthsSet.add(`${eventDate.year}-${eventDate.month}`);
        });
    });

    return Array.from(monthsSet)
      .map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month, 1);
        return {
          name: date.toLocaleString('en-US', { month: 'long' }),
          number: month, // 0-indexed month
          year: year,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.number - b.number;
      });
  };

  const monthsWithEvents = getMonthsWithEvents();

  if (monthsWithEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">No events with dates found to display in calendar view.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {monthsWithEvents.map((month) => {
        const daysInMonth = getDaysInMonth(month.number, month.year);
        const firstDay = getFirstDayOfMonth(month.number, month.year);

        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const emptyCells = Array.from({ length: firstDay }, (_, i) => i);

        return (
          <div
            key={`${month.name}-${month.year}`}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <h3
                className="text-xl font-bold text-center"
                style={{ color: '#456882' }}
              >
                {month.name} {month.year}
              </h3>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Weekday headers */}
              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map((day) => (
                <div
                  key={day}
                  className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-600"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the first of the month */}
              {emptyCells.map((_, index) => (
                <div key={`empty-${index}`} className="bg-white h-24"></div>
              ))}

              {/* Days of the month */}
              {days.map((day) => {
                const dayEvents = Object.entries(courseEvents).flatMap(
                  ([courseKey, events]) => {
                    return events
                      .filter((event) => event.event_date)
                      .filter((event) => {
                        const eventDate = formatEventDate(event.event_date);
                        return (
                          eventDate.year === month.year &&
                          eventDate.month === month.number &&
                          eventDate.day === day
                        );
                      })
                      .map((event) => ({ ...event, courseKey }));
                  },
                );

                return (
                  <div
                    key={day}
                    className="bg-white h-24 p-1 border border-gray-100 overflow-y-auto"
                  >
                    <div className="text-xs font-semibold mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayEvents.map((event, idx) => {
                        const colorClass =
                          courseColors[event.courseKey] ||
                          'bg-gray-100 border-gray-300 text-gray-800';

                        return (
                          <div
                            key={idx}
                            className={`text-xs p-1 rounded truncate border ${colorClass}`}
                            title={`${event.courseKey
                              .split('*')
                              .slice(0, 2)
                              .join(' ')} - ${event.event_type}`}
                          >
                            <div className="font-semibold truncate">
                              {event.event_type}
                            </div>
                            {event.time && (
                              <div className="truncate">
                                {event.time.replace('?', '-')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EventBuilderPage = () => {
  const { user } = useAuth();
  const [offeredTerms, setOfferedTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [courseTypes, setCourseTypes] = useState([]);
  const [availableCourses, setAvailableCourses] = useState({});
  const [availableSections, setAvailableSections] = useState({});
  const [courseEvents, setCourseEvents] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseColors, setCourseColors] = useState({});

  // Course selection state
  const [newCourse, setNewCourse] = useState({
    course_type: '',
    course_code: '',
    course_section: '',
  });

  // Fetch offered terms on component mount with has_events=true
  useEffect(() => {
    fetchOfferedTerms();
  }, []);

  // Fetch course types when term is selected and reset dependent fields
  useEffect(() => {
    if (selectedTerm) {
      fetchCourseTypes();
      setNewCourse({ course_type: '', course_code: '', course_section: '' });
      setAvailableCourses({});
      setAvailableSections({});
      setCourseTypes([]);
      setCourseEvents({});
      setSelectedCourses([]);
      setCourseColors({}); // Also clear colors on term change
    }
  }, [selectedTerm]);

  const fetchOfferedTerms = async () => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/offered_terms/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          credentials: 'include',
          body: JSON.stringify({ has_events: true }),
        },
      );
      const data = await response.json();
      setOfferedTerms(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch offered terms' });
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/course_types/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            offered_term: selectedTerm,
            has_events: true,
          }),
        },
      );
      const data = await response.json();
      setCourseTypes(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch course types' });
    }
  };

  const fetchCourseCodes = async (courseType) => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/course_codes/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            offered_term: selectedTerm,
            course_type: courseType,
            has_events: true,
          }),
        },
      );
      const data = await response.json();
      if (!availableCourses[courseType]) {
        setAvailableCourses((prev) => ({ ...prev, [courseType]: data }));
      }
      return data;
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch course codes' });
      return [];
    }
  };

  const fetchSectionNumbers = async (courseType, courseCode) => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/section_numbers/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            offered_term: selectedTerm,
            course_type: courseType,
            course_code: courseCode,
            has_events: true,
          }),
        },
      );
      const data = await response.json();
      const sectionKey = `${courseType}_${courseCode}`;
      setAvailableSections((prev) => ({ ...prev, [sectionKey]: data }));
      return data;
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch section numbers' });
      return [];
    }
  };

  const addCourse = async () => {
    if (
      !newCourse.course_type ||
      !newCourse.course_code ||
      !newCourse.course_section
    ) {
      setMessage({
        type: 'error',
        text: 'Please select course type, code, and section',
      });
      return;
    }

    const courseKey = `${newCourse.course_type}*${newCourse.course_code}*${newCourse.course_section}`;

    if (
      selectedCourses.some(
        (c) =>
          `${c.course_type}*${c.course_code}*${c.course_section}` ===
          courseKey,
      )
    ) {
      setMessage({ type: 'error', text: 'Course section already added' });
      return;
    }

    const courseToAdd = {
      course_type: newCourse.course_type,
      course_code: newCourse.course_code,
      course_section: newCourse.course_section,
    };

    setSelectedCourses((prev) => [...prev, courseToAdd]);
    setNewCourse({ course_type: '', course_code: '', course_section: '' });
    setMessage({ type: 'success', text: 'Course section added successfully' });

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const removeCourse = (index) => {
    setSelectedCourses((prev) => prev.filter((_, i) => i !== index));
    setCourseEvents({}); // Clear events to trigger a refetch if needed
    setCourseColors({}); // Clear colors to reset on course removal
  };

  const fetchCourseEvents = async () => {
    if (selectedCourses.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please add at least one course section',
      });
      return;
    }

    setIsLoading(true);
    setCourseEvents({});
    setCourseColors({});

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/course_events_schedule/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          body: JSON.stringify({
            sections: selectedCourses.map((course) => ({
              course_type: course.course_type,
              course_code: course.course_code,
              section_number: course.course_section,
              offered_term: selectedTerm,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourseEvents(data);

      const newColors = {};
      const colorPalette = [
        'bg-red-100 border-red-300 text-red-800',
        'bg-blue-100 border-blue-300 text-blue-800',
        'bg-green-100 border-green-300 text-green-800',
        'bg-purple-100 border-purple-300 text-purple-800',
        'bg-orange-100 border-orange-300 text-orange-800',
        'bg-pink-100 border-pink-300 text-pink-800',
        'bg-indigo-100 border-indigo-300 text-indigo-800',
        'bg-yellow-100 border-yellow-300 text-yellow-800',
        'bg-teal-100 border-teal-300 text-teal-800',
        'bg-gray-100 border-gray-300 text-gray-800',
      ];
      let colorIndex = 0;
      const courseCodeColorMap = new Map(); // To track colors for unique course_type*course_code

      // Create a unique list of courseType*courseCode identifiers from selectedCourses
      const uniqueCourseCodes = Array.from(new Set(
        selectedCourses.map(course => `${course.course_type}*${course.course_code}`)
      ));

      // Assign a consistent color to each unique course code
      uniqueCourseCodes.forEach(identifier => {
        const color = colorPalette[colorIndex % colorPalette.length];
        courseCodeColorMap.set(identifier, color);
        colorIndex++;
      });
      
      // Now, apply these colors to each specific course section
      Object.keys(data).forEach((courseKey) => {
        const [courseType, courseCode] = courseKey.split('*');
        const courseCodeIdentifier = `${courseType}*${courseCode}`;
        newColors[courseKey] = courseCodeColorMap.get(courseCodeIdentifier);
      });

      setCourseColors(newColors);

      setMessage({
        type: 'success',
        text: `Found events for ${
          Object.keys(data).length
        } course sections`,
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error fetching course events:', error);
      setMessage({
        type: 'error',
        text: 'Failed to fetch course events. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportEventsToCalendar = async () => {
    if (Object.keys(courseEvents).length === 0) {
      setMessage({ type: 'error', text: 'No events to export' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/export_events/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          body: JSON.stringify(courseEvents),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'course_events.ics';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Events exported successfully! Check your downloads.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error exporting events:', error);
      setMessage({
        type: 'error',
        text: 'Failed to export events. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const getCsrfToken = () => {
    const name = 'csrftoken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  };

  const formatTime = (timeStr) => {
    return timeStr.replace('?', '-');
  };

  const submitSuggestion = async () => {
    if (!suggestion.trim()) return;

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/scheduler/submit_suggestion/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
          },
          credentials: 'include',
          body: JSON.stringify({ suggestion: suggestion.trim() }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setSuggestion('');
        setShowSuggestionForm(false);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit suggestion' });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F9FF' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-3 mb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#456882' }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
                Course Events Builder
              </h1>
            </div>

            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Get detailed course events and deadlines. Add them to your
              personal calendar to stay organized.
            </p>
          </motion.div>

          {/* How to Use */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <Info className="w-6 h-6 mr-3" style={{ color: '#456882' }} />
              <h2
                className="text-2xl font-bold"
                style={{ color: '#456882' }}
              >
                How to Use Events Builder
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#456882' }}
                >
                  <span className="text-white font-bold">1</span>
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: '#456882' }}
                >
                  Select Term & Course Sections
                </h3>
                <p className="text-sm text-neutral-600">
                  Choose your academic term and add the specific course sections
                  you are enrolled in.
                </p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#456882' }}
                >
                  <span className="text-white font-bold">2</span>
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: '#456882' }}
                >
                  Fetch Events
                </h3>
                <p className="text-sm text-neutral-600">
                  Get all assignments, labs, exams and their due dates for your
                  course sections.
                </p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#456882' }}
                >
                  <span className="text-white font-bold">3</span>
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: '#456882' }}
                >
                  Export & Import
                </h3>
                <p className="text-sm text-neutral-600">
                  Export events to calendar format and import into Google
                  Calendar, Outlook, or Apple Calendar.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Messages */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
                <button
                  onClick={() => setMessage({ type: '', text: '' })}
                  className="text-current hover:opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Term Selection */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#456882' }}>
              Select Term
            </h2>

            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#456882' }}
            >
              <option value="">Select Term</option>
              {offeredTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Course Selection */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#456882' }}>
              Add Course Sections
            </h2>

            {/* Course Addition Form */}
            <div className="grid md:grid-cols-5 gap-4 mb-6">
              <select
                value={newCourse.course_type}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    course_type: e.target.value,
                    course_code: '',
                    course_section: '',
                  }))
                }
                disabled={!selectedTerm}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
              >
                <option value="">Course Type</option>
                {courseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={newCourse.course_code}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    course_code: e.target.value,
                    course_section: '',
                  }))
                }
                disabled={!newCourse.course_type}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
                onFocus={() => {
                  if (
                    newCourse.course_type &&
                    !availableCourses[newCourse.course_type]
                  ) {
                    fetchCourseCodes(newCourse.course_type);
                  }
                }}
              >
                <option value="">Course Code</option>
                {availableCourses[newCourse.course_type]?.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <select
                value={newCourse.course_section}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    course_section: e.target.value,
                  }))
                }
                disabled={!newCourse.course_code}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
                onFocus={() => {
                  if (newCourse.course_type && newCourse.course_code) {
                    fetchSectionNumbers(
                      newCourse.course_type,
                      newCourse.course_code,
                    );
                  }
                }}
              >
                <option value="">Select Section</option>
                {availableSections[
                  `${newCourse.course_type}_${newCourse.course_code}`
                ]?.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>

              <motion.button
                onClick={addCourse}
                disabled={
                  !newCourse.course_type ||
                  !newCourse.course_code ||
                  !newCourse.course_section
                }
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" />
                <span>Add Course</span>
              </motion.button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Info className="w-4 h-4 inline mr-2" />
                For course events, you must select specific sections as events
                are section-specific.
              </p>
            </div>

            {/* Selected Courses */}
            {selectedCourses.length > 0 && (
              <div>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: '#456882' }}
                >
                  Selected Course Sections ({selectedCourses.length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCourses.map((course, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div>
                        <span className="font-medium">
                          {course.course_type} {course.course_code}
                        </span>
                        <div className="text-sm text-neutral-600">
                          Section: {course.course_section}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCourse(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Fetch Events Button */}
          {selectedCourses.length > 0 && (
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                onClick={fetchCourseEvents}
                disabled={isLoading}
                className="px-8 py-4 rounded-lg font-bold text-white text-lg flex items-center space-x-3 mx-auto hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Calendar className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Fetching...' : 'Get Course Events'}</span>
              </motion.button>
            </motion.div>
          )}

          {/* Course Events Results */}
          {Object.keys(courseEvents).length > 0 && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Events Header with Download Button */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ color: '#456882' }}
                    >
                      Your Course Schedule Overview
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {Object.keys(courseEvents).length} course section
                          {Object.keys(courseEvents).length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>
                          {Object.values(courseEvents).reduce(
                            (total, events) => total + events.length,
                            0,
                          )}{' '}
                          total events
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={exportEventsToCalendar}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    style={{ backgroundColor: '#456882' }}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Generating file...' : 'Export Schedule to Calendar'}</span>
                  </motion.button>
                </div>
              </div>

              {/* Color Coding Scheme (Legend) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: '#456882' }}
                >
                  Color Key for Your Schedule
                </h3>
                <div className="flex flex-wrap gap-4">
                  {/* Extract unique course type/code combinations and their colors */}
                  {Array.from(new Set(Object.keys(courseEvents).map(key => {
                    const [type, code] = key.split('*');
                    return `${type}*${code}`;
                  }))).map((courseCodeIdentifier) => {
                    // Find the color assigned to this course code (from any of its sections)
                    const colorClass = Object.entries(courseColors).find(([key, color]) => 
                      key.startsWith(courseCodeIdentifier)
                    )?.[1] || 'bg-gray-100 border-gray-300 text-gray-800'; // Fallback
                    
                    const [type, code] = courseCodeIdentifier.split('*');
                    
                    return (
                      <div 
                        key={courseCodeIdentifier} 
                        className={`flex items-center space-x-2 p-2 rounded-lg border ${colorClass}`}
                      >
                        <div className={`w-4 h-4 rounded-full ${colorClass.split(' ')[0].replace('100', '500')}`} /> {/* Use darker shade for solid color dot */}
                        <span className="text-sm font-medium">{type} {code}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>


              {/* Monthly Calendar Grid Display */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
              >
                <h3
                  className="text-xl font-bold mb-6 text-center"
                  style={{ color: '#456882' }}
                >
                  Your Combined Course Schedule
                </h3>
                <MonthlyCalendarGrid
                  courseEvents={courseEvents}
                  courseColors={courseColors}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Suggestion Form */}
          <motion.div
            className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl font-bold"
                style={{ color: '#456882' }}
              >
                Feedback & Suggestions
              </h3>
              <button
                onClick={() => setShowSuggestionForm(!showSuggestionForm)}
                className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                {showSuggestionForm ? 'Hide' : 'Show'} Form
              </button>
            </div>

            <AnimatePresence>
              {showSuggestionForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Share your feedback or suggest improvements..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                    style={{ '--tw-ring-color': '#456882' }}
                    rows={4}
                  />
                  <div className="text-right">
                    <motion.button
                      onClick={submitSuggestion}
                      disabled={!suggestion.trim()}
                      className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#456882' }}
                      whileHover={{ scale: suggestion.trim() ? 1.02 : 1 }}
                      whileTap={{ scale: suggestion.trim() ? 0.98 : 1 }}
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EventBuilderPage;