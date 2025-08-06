import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Filter,
  Grid,
  List,
  RefreshCw,
  Send
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const SchedulerPage = () => {
  const { user } = useAuth()
  const [offeredTerms, setOfferedTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [courseTypes, setCourseTypes] = useState([])
  const [availableCourses, setAvailableCourses] = useState({})
  const [schedules, setSchedules] = useState([])
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [pagination, setPagination] = useState({ offset: 0, limit: 50, hasMore: false })
  const resultsRef = useRef(null)
  const [courseColors, setCourseColors] = useState({})

  // Course selection state
  const [newCourse, setNewCourse] = useState({ course_type: '', course_code: '' })

  // Fetch offered terms on component mount
  useEffect(() => {
    fetchOfferedTerms()
  }, [])

  // Fetch course types when term is selected
  useEffect(() => {
    if (selectedTerm) {
      fetchCourseTypes()
    }
  }, [selectedTerm])

  const fetchOfferedTerms = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/offered_terms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || '' // Include CSRF token if available
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
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || '' // Include CSRF token if available
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
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || '' // Include CSRF token if available
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

  const addCourse = async () => {
    if (!newCourse.course_type || !newCourse.course_code) {
      setMessage({ type: 'error', text: 'Please select both course type and course code' })
      return
    }

    const courseKey = `${newCourse.course_type}*${newCourse.course_code}`
    if (selectedCourses.some(c => `${c.course_type}*${c.course_code}` === courseKey)) {
      setMessage({ type: 'error', text: 'Course already added' })
      return
    }

    setSelectedCourses(prev => [...prev, { ...newCourse }])
    setNewCourse({ course_type: '', course_code: '' })
    setMessage({ type: 'success', text: 'Course added successfully' })
    
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const removeCourse = (index) => {
    setSelectedCourses(prev => prev.filter((_, i) => i !== index))
    setSchedules([])
    setCurrentScheduleIndex(0)
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
        headers: { 'Content-Type': 'application/json' ,
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
          // Get unique course type-code combinations
          const uniqueCourseTypeCodes = new Set()
          data.schedules.forEach(schedule => {
            Object.keys(schedule).forEach(courseKey => {
              const courseTypeCode = courseKey.split('*').slice(0, 2).join('*')
              uniqueCourseTypeCodes.add(courseTypeCode)
            })
          })
          
          // Pre-assign colors to ensure consistent coloring
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
          
          // Sort course type-codes for consistent assignment
          const sortedCourseTypeCodes = Array.from(uniqueCourseTypeCodes).sort()
          
          // Pre-assign colors to all course keys
          const newCourseColors = {}
          data.schedules.forEach(schedule => {
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
        
        if (loadMore) {
          setSchedules(prev => [...prev, ...data.schedules])
        } else {
          setSchedules(data.schedules)
          setCurrentScheduleIndex(0)
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }
        
        setPagination({
          offset: data.offset,
          limit: data.limit,
          hasMore: data.has_more
        })
  
        setMessage({ 
          type: 'success', 
          text: data.message || `Found ${data.schedules.length} conflict-free schedules` 
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
  
  const exportSchedule = async () => {
    if (schedules.length === 0) return
  
    try {
      const currentSchedule = schedules[currentScheduleIndex]
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/export_events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || '' // Include CSRF token if available
        },
        credentials: 'include',
        body: JSON.stringify(currentSchedule)
      })
  
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'schedule.ics'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        setMessage({ type: 'success', text: 'Schedule exported successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to export schedule' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed' })
    }
  }
  
  const exportSingleSchedule = async (schedule) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/export_events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify(schedule)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'schedule.ics'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        setMessage({ type: 'success', text: 'Schedule exported successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to export schedule' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed' })
    }
  }

  const submitSuggestion = async () => {
    if (!suggestion.trim()) return
  
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/scheduler/submit_suggestion/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
          'X-CSRFToken': getCsrfToken() || '' // Include CSRF token if available
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
      
      // Extract course type and code from courseKey (e.g., "ENGG*1500*01" -> "ENGG*1500")
      const courseTypeCode = courseKey.split('*').slice(0, 2).join('*')
      
      // Get all existing course type-code combinations to maintain consistent ordering
      const allCourseTypeCodes = new Set()
      Object.keys(courseColors).forEach(key => {
        const typeCode = key.split('*').slice(0, 2).join('*')
        allCourseTypeCodes.add(typeCode)
      })
      
      // If this course type-code combination already has a color, use it
      const existingEntry = Object.entries(courseColors).find(([key, color]) => {
        const keyTypeCode = key.split('*').slice(0, 2).join('*')
        return keyTypeCode === courseTypeCode
      })
      
      if (existingEntry) {
        const selectedColor = existingEntry[1]
        setCourseColors(prev => ({ ...prev, [courseKey]: selectedColor }))
        return selectedColor
      }
      
      // Assign new color based on the number of unique course type-code combinations
      const courseIndex = allCourseTypeCodes.size
      const selectedColor = colors[courseIndex % colors.length]
      
      setCourseColors(prev => ({ ...prev, [courseKey]: selectedColor }))
      return selectedColor
    }
    return courseColors[courseKey]
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
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
                Course Scheduler
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
                How to Use
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>Select Term & Courses</h3>
                <p className="text-sm text-neutral-600">Choose your academic term and add the courses you want to take.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>Generate Schedules</h3>
                <p className="text-sm text-neutral-600">Our algorithm finds all possible conflict-free schedule combinations.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>Export & Use</h3>
                <p className="text-sm text-neutral-600">Browse schedules and export your favorite to your calendar app.</p>
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
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <select
                value={newCourse.course_type}
                onChange={(e) => setNewCourse(prev => ({ ...prev, course_type: e.target.value, course_code: '' }))}
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
                onChange={(e) => setNewCourse(prev => ({ ...prev, course_code: e.target.value }))}
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
                      <span className="font-medium">
                        {course.course_type} {course.course_code}
                      </span>
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
                <span>{isLoading ? 'Generating...' : 'Generate Schedules'}</span>
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
              {/* Schedule Navigation */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold" style={{ color: '#456882' }}>
                    Showing {schedules.length} Conflict-Free Schedules
                  </h3>
                  
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
                  </div>
                </div>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center mb-4">
                    <motion.button
                      onClick={() => generateSchedules(true)}
                      disabled={isLoading}
                      className="px-6 py-2 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                      style={{ backgroundColor: '#456882' }}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        <>Load More Schedules</>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Schedule Grid Display - 3 schedules per row */}
<div className="space-y-12">
  {Array.from({ length: Math.ceil(schedules.length / 3) }, (_, rowIndex) => (
    <div key={rowIndex} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {schedules.slice(rowIndex * 3, (rowIndex + 1) * 3).map((schedule, scheduleIndex) => {
        const globalIndex = rowIndex * 3 + scheduleIndex
        return (
          <div 
            key={globalIndex}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 overflow-hidden"
          >
            {/* Schedule Header */}
            <div className="p-4 border-b border-neutral-200" style={{ backgroundColor: '#456882' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">
                  Schedule {globalIndex + 1}
                </h4>
                <motion.button
                  onClick={() => exportSingleSchedule(schedule)}
                  className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Schedule Content */}
            <div className="p-4">
              {viewMode === 'calendar' ? (
                <CompactScheduleCalendarView schedule={schedule} getEventColor={getEventColor} />
              ) : (
                <CompactScheduleListView schedule={schedule} getEventColor={getEventColor} formatTime={formatTime} />
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
    </div>
  )
}

// Compact Schedule Calendar View Component
const CompactScheduleCalendarView = ({ schedule, getEventColor }) => {
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
                      className={`p-1 rounded text-xs mb-1 ${getEventColor(event.courseKey)}`}
                      title={`${event.courseKey} ${event.event_type} - ${event.times}`}
                    >
                      <div className="font-semibold truncate">{event.courseKey.split('*')[0]}</div>
                      <div className="truncate">{event.event_type}</div>
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

// Compact Schedule List View Component  
const CompactScheduleListView = ({ schedule, getEventColor, formatTime }) => {
  return (
    <div className="space-y-3 text-xs">
      {Object.entries(schedule).map(([courseKey, events]) => (
        <div key={courseKey}>
          <h5 className="font-semibold mb-2 text-sm" style={{ color: '#456882' }}>
            {courseKey.replace(/\*/g, ' ')}
          </h5>
          <div className="space-y-2">
            {events.map((event, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${getEventColor(courseKey)}`}
              >
                <div className="font-semibold">{event.event_type}</div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.times)}</span>
                </div>
                {event.days && (
                  <div className="text-neutral-600">{event.days}</div>
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

export default SchedulerPage