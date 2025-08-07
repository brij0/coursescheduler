import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  MoreHorizontal,
  ArrowUp,
  Users,
  Hash,
  Send
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ConflictFreeSchedulePage = () => {
  const { user } = useAuth()
  const [offeredTerms, setOfferedTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [courseTypes, setCourseTypes] = useState([])
  const [availableCourses, setAvailableCourses] = useState({})
  const [availableSections, setAvailableSections] = useState({})
  const [schedules, setSchedules] = useState([])
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [pagination, setPagination] = useState({ 
    offset: 0, 
    limit: 50, 
    hasMore: false, 
    total: 'unknown',
    currentBatch: 0 
  })
  const [selectedScheduleForView, setSelectedScheduleForView] = useState(null)
  const resultsRef = useRef(null)
  const loadMoreRef = useRef(null)
  const [courseColors, setCourseColors] = useState({})

  // Course selection state - updated to include section
  const [newCourse, setNewCourse] = useState({ 
    course_type: '', 
    course_code: '', 
    course_section: '' 
  })

  // Fetch offered terms on component mount
  useEffect(() => {
    fetchOfferedTerms()
  }, [])

  // Fetch course types when term is selected and reset dependent fields
  useEffect(() => {
    if (selectedTerm) {
      fetchCourseTypes()
      // Reset course selection when term changes
      setNewCourse({ course_type: '', course_code: '', course_section: '' })
      // Clear cached data for the previous term
      setAvailableCourses({})
      setAvailableSections({})
      setCourseTypes([])
    }
  }, [selectedTerm])

  const fetchOfferedTerms = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/offered_terms/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({ has_events: false })
      })
      const data = await response.json()
      setOfferedTerms(data)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch offered terms' })
    }
  }

  const fetchCourseTypes = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/course_types/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          has_events: false 
        })
      })
      const data = await response.json()
      setCourseTypes(data)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch course types' })
    }
  }

  const fetchCourseCodes = async (courseType) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/course_codes/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          course_type: courseType,
          has_events: false
        })
      })
      const data = await response.json()
      if (!availableCourses[courseType]) {
        setAvailableCourses(prev => ({ ...prev, [courseType]: data }))
      }
      return data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch course codes' })
      return []
    }
  }

  const fetchSectionNumbers = async (courseType, courseCode) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/section_numbers/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          course_type: courseType,
          course_code: courseCode,
          has_events: false
        })
      })
      const data = await response.json()
      const sectionKey = `${courseType}_${courseCode}`
      setAvailableSections(prev => ({ ...prev, [sectionKey]: data }))
      return data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch section numbers' })
      return []
    }
  }

  const addCourse = async () => {
    if (!newCourse.course_type || !newCourse.course_code) {
      setMessage({ type: 'error', text: 'Please select course type and code' })
      return
    }

    const courseKey = `${newCourse.course_type}*${newCourse.course_code}`
    
    if (selectedCourses.some(c => `${c.course_type}*${c.course_code}` === courseKey)) {
      setMessage({ type: 'error', text: 'Course already added' })
      return
    }

    const courseToAdd = {
      course_type: newCourse.course_type,
      course_code: newCourse.course_code
    }
    
    if (newCourse.course_section) {
      courseToAdd.course_section = newCourse.course_section
    }

    setSelectedCourses(prev => [...prev, courseToAdd])
    setNewCourse({ course_type: '', course_code: '', course_section: '' })
    setMessage({ type: 'success', text: 'Course added successfully' })
    
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const removeCourse = (index) => {
    setSelectedCourses(prev => prev.filter((_, i) => i !== index))
    setSchedules([])
    setCurrentScheduleIndex(0)
    setPagination({ offset: 0, limit: 50, hasMore: false, total: 'unknown', currentBatch: 0 })
  }

  const generateSchedules = async (loadMore = false) => {
    if (selectedCourses.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one course' })
      return
    }
  
    setIsLoading(true)
    try {
      const offset = loadMore ? pagination.offset + pagination.limit : 0
      
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/conflict_free_schedule/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          courses: selectedCourses,
          offered_term: selectedTerm,
          offset,
          limit: pagination.limit
        })
      })
  
      const data = await response.json()
      
      if (response.ok) {
        // Assign colors to courses when first loading schedules
        if (!loadMore && data.schedules.length > 0) {
          assignCourseColors(data.schedules)
        }
        
        if (loadMore) {
          setSchedules(prev => [...prev, ...data.schedules])
          setPagination(prev => ({
            offset: data.offset,
            limit: data.limit,
            hasMore: data.has_more,
            total: data.total || 'unknown',
            currentBatch: prev.currentBatch + 1
          }))
        } else {
          setSchedules(data.schedules)
          setCurrentScheduleIndex(0)
          setPagination({
            offset: data.offset,
            limit: data.limit,
            hasMore: data.has_more,
            total: data.total || 'unknown',
            currentBatch: 1
          })
          
          // Scroll to results only on initial generation
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }
  
        setMessage({ 
          type: 'success', 
          text: data.message || `Found ${data.schedules.length} ${loadMore ? 'additional ' : ''}conflict-free schedules` 
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate schedules' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const assignCourseColors = (schedules) => {
    const colors = [
      'bg-red-100 border-red-300 text-red-800',
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800', 
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-teal-100 border-teal-300 text-teal-800',
      'bg-gray-100 border-gray-300 text-gray-800'
    ]

    const uniqueCourseTypeCodes = new Set()
    schedules.forEach(schedule => {
      Object.keys(schedule).forEach(courseKey => {
        const courseTypeCode = courseKey.split('*').slice(0, 2).join('*')
        uniqueCourseTypeCodes.add(courseTypeCode)
      })
    })
    
    const sortedCourseTypeCodes = Array.from(uniqueCourseTypeCodes).sort()
    
    const newCourseColors = {}
    schedules.forEach(schedule => {
      Object.keys(schedule).forEach(courseKey => {
        if (!newCourseColors[courseKey]) {
          const courseTypeCode = courseKey.split('*').slice(0, 2).join('*')
          const index = sortedCourseTypeCodes.indexOf(courseTypeCode)
          newCourseColors[courseKey] = colors[index % colors.length]
        }
      })
    })
    
    setCourseColors(prev => ({ ...prev, ...newCourseColors }))
  }

  const scrollToTop = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const submitSuggestion = async () => {
    if (!suggestion.trim()) return
  
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/submit_suggestion/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({ suggestion: suggestion.trim() })
      })
  
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setSuggestion('')
        setShowSuggestionForm(false)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit suggestion' })
    }
  }

  const getCsrfToken = () => {
    const name = 'csrftoken='
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')
    
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim()
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length)
      }
    }
    return null
  }

  const formatTime = (timeStr) => {
    return timeStr.replace('?', '-')
  }

  const getEventColor = (courseKey) => {
    if (!courseColors[courseKey]) {
      const colors = [
        'bg-red-100 border-red-300 text-red-800',
        'bg-blue-100 border-blue-300 text-blue-800',
        'bg-green-100 border-green-300 text-green-800', 
        'bg-purple-100 border-purple-300 text-purple-800',
        'bg-orange-100 border-orange-300 text-orange-800',
        'bg-pink-100 border-pink-300 text-pink-800',
        'bg-indigo-100 border-indigo-300 text-indigo-800',
        'bg-yellow-100 border-yellow-300 text-yellow-800',
        'bg-teal-100 border-teal-300 text-teal-800',
        'bg-gray-100 border-gray-300 text-gray-800'
      ]
      
      const courseTypeCode = courseKey.split('*').slice(0, 2).join('*')
      const existingEntry = Object.entries(courseColors).find(([key, color]) => {
        const keyTypeCode = key.split('*').slice(0, 2).join('*')
        return keyTypeCode === courseTypeCode
      })
      
      if (existingEntry) {
        const selectedColor = existingEntry[1]
        setCourseColors(prev => ({ ...prev, [courseKey]: selectedColor }))
        return selectedColor
      }
      
      const allCourseTypeCodes = new Set()
      Object.keys(courseColors).forEach(key => {
        const typeCode = key.split('*').slice(0, 2).join('*')
        allCourseTypeCodes.add(typeCode)
      })
      
      const courseIndex = allCourseTypeCodes.size
      const selectedColor = colors[courseIndex % colors.length]
      
      setCourseColors(prev => ({ ...prev, [courseKey]: selectedColor }))
      return selectedColor
    }
    return courseColors[courseKey]
  }

  const openFullScheduleView = (schedule, index) => {
    setSelectedScheduleForView({ schedule, index })
  }

  const closeFullScheduleView = () => {
    setSelectedScheduleForView(null)
  }

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
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#456882' }}>
                <Grid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
                Build Conflict-Free Schedule
              </h1>
            </div>
            
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Create conflict-free course schedules effortlessly. Select your courses and let our AI find the perfect timetable for you.
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
              <h2 className="text-2xl font-bold" style={{ color: '#456882' }}>
                How to Use Schedule Builder
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>
                  Select Term & Courses
                </h3>
                <p className="text-sm text-neutral-600">
                  Choose your academic term and add the courses you want to take. Optionally select specific sections.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>
                  Generate Schedules
                </h3>
                <p className="text-sm text-neutral-600">
                  Our algorithm finds all possible conflict-free schedule combinations.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>
                  Browse & Select
                </h3>
                <p className="text-sm text-neutral-600">
                  Browse through generated schedules and find the one that works best for you.
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
              {offeredTerms.map(term => (
                <option key={term} value={term}>{term}</option>
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
              Add Courses
            </h2>

            {/* Course Addition Form */}
            <div className="grid md:grid-cols-5 gap-4 mb-6">
              <select
                value={newCourse.course_type}
                onChange={(e) => setNewCourse(prev => ({ 
                  ...prev, 
                  course_type: e.target.value, 
                  course_code: '', 
                  course_section: '' 
                }))}
                disabled={!selectedTerm}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
              >
                <option value="">Course Type</option>
                {courseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={newCourse.course_code}
                onChange={(e) => setNewCourse(prev => ({ 
                  ...prev, 
                  course_code: e.target.value, 
                  course_section: '' 
                }))}
                disabled={!newCourse.course_type}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
                onFocus={() => {
                  if (newCourse.course_type && !availableCourses[newCourse.course_type]) {
                    fetchCourseCodes(newCourse.course_type)
                  }
                }}
              >
                <option value="">Course Code</option>
                {availableCourses[newCourse.course_type]?.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>

              <select
                value={newCourse.course_section}
                onChange={(e) => setNewCourse(prev => ({ 
                  ...prev, 
                  course_section: e.target.value 
                }))}
                disabled={!newCourse.course_code}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ '--tw-ring-color': '#456882' }}
                onFocus={() => {
                  if (newCourse.course_type && newCourse.course_code) {
                    fetchSectionNumbers(newCourse.course_type, newCourse.course_code)
                  }
                }}
              >
                <option value="">Any Section</option>
                {availableSections[`${newCourse.course_type}_${newCourse.course_code}`]?.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>

              <motion.button
                onClick={addCourse}
                disabled={!newCourse.course_type || !newCourse.course_code}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" />
                <span>Add Course</span>
              </motion.button>
            </div>

            {/* Selected Courses */}
            {selectedCourses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#456882' }}>
                  Selected Courses ({selectedCourses.length})
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
                        {course.course_section && (
                          <div className="text-sm text-neutral-600">
                            Section: {course.course_section}
                          </div>
                        )}
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

          {/* Generate Schedules Button */}
          {selectedCourses.length > 0 && (
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                onClick={() => generateSchedules(false)}
                disabled={isLoading}
                className="px-8 py-4 rounded-lg font-bold text-white text-lg flex items-center space-x-3 mx-auto hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
                <span>
                  {isLoading ? 'Generating...' : 'Generate Schedules'}
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* Schedule Results */}
          {schedules.length > 0 && (
            <motion.div
              ref={resultsRef}
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Results Header with Statistics */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#456882' }}>
                      Schedule Results
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Showing {schedules.length} schedules</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Batch {pagination.currentBatch}</span>
                      </div>
                      {pagination.hasMore && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <MoreHorizontal className="w-4 h-4" />
                          <span>More available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'calendar' 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                        }`}
                        style={viewMode === 'calendar' ? { backgroundColor: '#456882' } : {}}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'list' 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                        }`}
                        style={viewMode === 'list' ? { backgroundColor: '#456882' } : {}}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Back to Top Button */}
                    <button
                      onClick={scrollToTop}
                      className="p-2 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors"
                      title="Back to top"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Load More Section - Positioned at the top for better UX */}
                {pagination.hasMore && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            More schedules available
                          </p>
                          <p className="text-xs text-blue-600">
                            Currently showing {schedules.length} of {pagination.total === 'unknown' ? 'many' : pagination.total} possible schedules
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => generateSchedules(true)}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                        style={{ backgroundColor: '#456882' }}
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Loading...' : 'Load More'}</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Grid Display */}
              <div className="space-y-8">
                {Array.from({ length: Math.ceil(schedules.length / 3) }, (_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {schedules.slice(rowIndex * 3, (rowIndex + 1) * 3).map((schedule, scheduleIndex) => {
                      const globalIndex = rowIndex * 3 + scheduleIndex
                      return (
                        <div 
                          key={globalIndex}
                          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                          {/* Enhanced Schedule Header */}
                          <div className="p-4 border-b border-neutral-200" style={{ backgroundColor: '#456882' }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-white font-semibold">
                                  Schedule {globalIndex + 1}
                                </h4>
                                <p className="text-white/80 text-xs">
                                  {Object.keys(schedule).length} course{Object.keys(schedule).length > 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  onClick={() => openFullScheduleView(schedule, globalIndex)}
                                  className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="View full schedule"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Content */}
                          <div className="p-4">
                            {viewMode === 'calendar' ? (
                              <CompactScheduleCalendarView 
                                schedule={schedule} 
                                getEventColor={getEventColor}
                                showSectionInfo={true}
                              />
                            ) : (
                              <CompactScheduleListView 
                                schedule={schedule} 
                                getEventColor={getEventColor} 
                                formatTime={formatTime}
                                showSectionInfo={true}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
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
              <h3 className="text-xl font-bold" style={{ color: '#456882' }}>
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

      {/* Full Schedule View Modal */}
      <AnimatePresence>
        {selectedScheduleForView && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFullScheduleView}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-200" style={{ backgroundColor: '#456882' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Schedule {selectedScheduleForView.index + 1} - Full View
                    </h2>
                    <p className="text-white/80">
                      Complete schedule with all course sections
                    </p>
                  </div>
                  <button
                    onClick={closeFullScheduleView}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <FullScheduleView 
                  schedule={selectedScheduleForView.schedule} 
                  getEventColor={getEventColor} 
                  formatTime={formatTime}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Compact Schedule Calendar View Component
const CompactScheduleCalendarView = ({ schedule, getEventColor, showSectionInfo = false }) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 8 + i
    return hour <= 12 ? `${hour}:00` : `${hour - 12}:00`
  })

  const parseTimeToMinutes = (timeStr) => {
    try {
      const time = timeStr.split('-')[0].trim()
      const [timePart, period] = time.includes('AM') || time.includes('PM') 
        ? [time.replace(/AM|PM/, '').trim(), time.includes('PM') ? 'PM' : 'AM']
        : [time, 'AM']
      
      let [hour, minute = 0] = timePart.split(':').map(Number)
      
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      return hour * 60 + minute
    } catch {
      return 0
    }
  }

  const getTimeSlot = (eventTime) => {
    const eventMinutes = parseTimeToMinutes(eventTime)
    const eventHour = Math.floor(eventMinutes / 60)
    return Math.max(0, Math.min(13, eventHour - 8))
  }

  const getDayEvents = (day) => {
    const events = []
    Object.entries(schedule).forEach(([courseKey, courseEvents]) => {
      courseEvents.forEach(event => {
        if (event.days && event.days.toLowerCase().includes(day.toLowerCase())) {
          events.push({ ...event, courseKey })
        }
      })
    })
    return events
  }

  return (
    <div className="text-xs">
      {/* Course Legend */}
      {showSectionInfo && (
        <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
          <h5 className="font-semibold text-xs mb-2 text-neutral-700">Course Sections:</h5>
          <div className="space-y-1">
            {Object.keys(schedule).map(courseKey => (
              <div key={courseKey} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${getEventColor(courseKey)} border`}></div>
                <span className="text-xs font-medium">{courseKey.replace(/\*/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-1">
        {/* Header */}
        <div className="text-center font-semibold p-1" style={{ color: '#456882' }}>Time</div>
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold p-1" style={{ color: '#456882' }}>
            {day}
          </div>
        ))}

        {/* Time Slots */}
        {timeSlots.map((time, timeIndex) => (
          <React.Fragment key={time}>
            <div className="p-1 text-neutral-600 border-t border-neutral-200 text-center">
              {timeIndex + 8 <= 12 ? `${timeIndex + 8}${timeIndex + 8 < 12 ? 'AM' : 'PM'}` : `${timeIndex + 8 - 12}PM`}
            </div>
            {daysOfWeek.map(day => {
              const dayEvents = getDayEvents(day).filter(event => {
                const eventSlot = getTimeSlot(event.times)
                return eventSlot === timeIndex
              })
              
              return (
                <div key={`${day}-${time}`} className="p-1 border-t border-neutral-200 min-h-[40px]">
                  {dayEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className={`p-1 rounded text-xs mb-1 border ${getEventColor(event.courseKey)} relative group`}
                      title={`${event.courseKey} ${event.event_type} - ${event.times} ${event.location ? `at ${event.location}` : ''}`}
                    >
                      <div className="font-semibold truncate">{event.courseKey.split('*')[0]}</div>
                      <div className="truncate">{event.event_type}</div>
                      {showSectionInfo && (
                        <div className="text-xs opacity-70 truncate">
                          {event.courseKey.split('*')[2]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Enhanced Compact Schedule List View Component  
const CompactScheduleListView = ({ schedule, getEventColor, formatTime, showSectionInfo = false }) => {
  return (
    <div className="space-y-3 text-xs">
      {Object.entries(schedule).map(([courseKey, events]) => (
        <div key={courseKey}>
          <h5 className="font-semibold mb-2 text-sm flex items-center justify-between" style={{ color: '#456882' }}>
            <span>{courseKey.replace(/\*/g, ' ')}</span>
            {showSectionInfo && (
              <span className="text-xs font-normal text-neutral-500">
                Section {courseKey.split('*')[2]}
              </span>
            )}
          </h5>
          <div className="space-y-2">
            {events.map((event, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border ${getEventColor(courseKey)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{event.event_type}</div>
                  {showSectionInfo && event.instructor && (
                    <div className="text-xs text-neutral-600 truncate">
                      {event.instructor}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.times)}</span>
                </div>
                {event.days && (
                  <div className="text-neutral-600 mb-1">{event.days}</div>
                )}
                {event.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Full Schedule View Component for Modal
const FullScheduleView = ({ schedule, getEventColor, formatTime }) => {
  const [viewMode, setViewMode] = useState('calendar')
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8)

  const parseTimeToMinutes = (timeStr) => {
    try {
      const time = timeStr.split('-')[0].trim()
      const [timePart, period] = time.includes('AM') || time.includes('PM') 
        ? [time.replace(/AM|PM/, '').trim(), time.includes('PM') ? 'PM' : 'AM']
        : [time, 'AM']
      
      let [hour, minute = 0] = timePart.split(':').map(Number)
      
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      return hour * 60 + minute
    } catch {
      return 0
    }
  }

  const getTimeSlot = (eventTime) => {
    const eventMinutes = parseTimeToMinutes(eventTime)
    const eventHour = Math.floor(eventMinutes / 60)
    return eventHour
  }

  const getDayEvents = (day) => {
    const events = []
    Object.entries(schedule).forEach(([courseKey, courseEvents]) => {
      courseEvents.forEach(event => {
        if (event.days && event.days.toLowerCase().includes(day.substring(0, 3).toLowerCase())) {
          events.push({ ...event, courseKey })
        }
      })
    })
    return events
  }

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: '#456882' }}>
          Detailed Schedule View
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'calendar' 
                ? 'bg-primary-500 text-white' 
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
            style={viewMode === 'calendar' ? { backgroundColor: '#456882' } : {}}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'list' 
                ? 'bg-primary-500 text-white' 
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
            style={viewMode === 'list' ? { backgroundColor: '#456882' } : {}}
          >
            List View
          </button>
        </div>
      </div>

      {/* Course Legend */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h4 className="font-semibold mb-3 text-neutral-700">Course Sections</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(schedule).map(([courseKey, events]) => (
            <div key={courseKey} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${getEventColor(courseKey)} border-2`}></div>
              <div>
                <div className="font-medium text-sm">{courseKey.replace(/\*/g, ' ')}</div>
                <div className="text-xs text-neutral-600">
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Calendar or List View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-6 gap-0">
            {/* Header */}
            <div className="p-3 bg-neutral-100 border-b border-neutral-200 font-semibold text-center">Time</div>
            {daysOfWeek.map(day => (
              <div key={day} className="p-3 bg-neutral-100 border-b border-neutral-200 font-semibold text-center">
                {day}
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                <div className="p-3 border-b border-neutral-200 text-center bg-neutral-50 font-medium">
                  {hour <= 12 ? `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}` : `${hour - 12}:00 PM`}
                </div>
                {daysOfWeek.map(day => {
                  const dayEvents = getDayEvents(day).filter(event => {
                    const eventHour = getTimeSlot(event.times)
                    return eventHour === hour
                  })
                  
                  return (
                    <div key={`${day}-${hour}`} className="p-2 border-b border-neutral-200 min-h-[80px]">
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded mb-2 border-2 ${getEventColor(event.courseKey)}`}
                        >
                          <div className="font-semibold text-sm">{event.courseKey.split('*')[0]} {event.courseKey.split('*')[1]}</div>
                          <div className="text-sm">{event.event_type}</div>
                          <div className="text-xs opacity-75">{formatTime(event.times)}</div>
                          {event.location && (
                            <div className="text-xs opacity-75 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(schedule).map(([courseKey, events]) => (
            <div key={courseKey} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className={`p-4 border-2 ${getEventColor(courseKey)}`}>
                <h4 className="font-bold text-lg">{courseKey.replace(/\*/g, ' ')}</h4>
                <p className="text-sm opacity-75">Section {courseKey.split('*')[2]}</p>
              </div>
              <div className="p-4 space-y-3">
                {events.map((event, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-3 bg-neutral-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getEventColor(courseKey)}`}></div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">{event.event_type}</div>
                      <div className="text-sm text-neutral-600 space-y-1">
                        {event.days && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.days}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(event.times)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.instructor && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{event.instructor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConflictFreeSchedulePage