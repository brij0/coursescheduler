import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Info,
  Download,
  Hash,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../contexts/API';
import TermSelector from '../components/TermSelector';
import CourseSelector from '../components/CourseSelector';
import SelectedCoursesList from '../components/SelectedCoursesList';
import MessageDisplay from '../components/MessageDisplay';


// New Component for Monthly Calendar Grid (no changes needed here from previous iteration)
const MonthlyCalendarGrid = ({ courseEvents, courseColors }) => {

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
    
    Object.entries(courseEvents).forEach(([, events]) => {
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
  const [isExporting, setIsExporting] = useState(false); // Add separate export loading state
  const [message, setMessage] = useState({ type: '', text: '' });
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
  useEffect(() => {
    if (newCourse.course_type && selectedTerm) {
      fetchCourseCodes(newCourse.course_type);
    }
  }, [newCourse.course_type, selectedTerm]);
  useEffect(() => {
    if (newCourse.course_type && newCourse.course_code && selectedTerm) {
      fetchSectionNumbers(newCourse.course_type, newCourse.course_code);
    }
  }, [newCourse.course_type, newCourse.course_code, selectedTerm]);
  const fetchOfferedTerms = async () => {
    try {
      const data = await api.fetchOfferedTerms(true);
      setOfferedTerms(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch offered terms' });
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const data = await api.fetchCourseTypes(selectedTerm, true);
      setCourseTypes(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch course types' });
    }
  };

  const fetchCourseCodes = async (courseType) => {
    try {
      const data = await api.fetchCourseCodes(selectedTerm, courseType, true);
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
      const data = await api.fetchSectionNumbers(selectedTerm, courseType, courseCode, true);
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
      const response = await api.fetchCourseEvents(
        selectedCourses.map((course) => ({
          course_type: course.course_type,
          course_code: course.course_code,
          section_number: course.course_section,
          offered_term: selectedTerm,
        })),
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
      setIsExporting(true);
      const response = await api.exportEvents(courseEvents);

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
      setIsExporting(false);
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
          <MessageDisplay message={message} setMessage={setMessage} />

          {/* Term Selection */}
          <TermSelector
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            offeredTerms={offeredTerms}
          />

          {/* Course Selection */}
          <CourseSelector
            title="Add Course Sections"
            newCourse={newCourse}
            setNewCourse={setNewCourse}
            courseTypes={courseTypes}
            availableCourses={availableCourses}
            availableSections={availableSections}
            selectedTerm={selectedTerm}
            onAddCourse={addCourse}
            requiresSection={true}
            sectionLabel="Select Section"
            infoMessage="For course events, you must select specific sections as events are section-specific."
            disabled={!selectedTerm}
          />

          {/* Selected Courses List */}
          <SelectedCoursesList
            courses={selectedCourses}
            onRemoveCourse={removeCourse}
            showSections={true}
            title="Selected Course Sections"
            emptyMessage="No course sections added yet."
            emptySubMessage="Use the form above to add course sections."
          />

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
                    disabled={isExporting}
                    className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    style={{ backgroundColor: '#456882' }}
                    whileHover={{ scale: isExporting ? 1 : 1.02 }}
                    whileTap={{ scale: isExporting ? 1 : 0.98 }}
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isExporting ? 'Generating file...' : 'Export Schedule to Calendar'}</span>
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
                    const colorClass = Object.entries(courseColors).find(([key]) => 
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
        </div>
      </section>
    </div>
  );
};

export default EventBuilderPage;