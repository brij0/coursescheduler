import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Download, 
  BookOpen, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  BarChart3
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const GPACalculatorPage = () => {
  const { user } = useAuth()
  const [offeredTerms, setOfferedTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [courses, setCourses] = useState([])
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [dataLoaded, setDataLoaded] = useState(false)
  const resultsRef = useRef(null)

  // Cache for API responses to prevent duplicate requests
  const [apiCache, setApiCache] = useState({
    offeredTerms: null,
    courseTypes: {},
    courseCodes: {},
    sectionNumbers: {},
    courseEvents: {}
  })

  // Fetch offered terms and load saved progress on component mount
  useEffect(() => {
    fetchOfferedTerms()
  }, [])

  // Load saved progress when user changes or data is loaded
  useEffect(() => {
    if (dataLoaded && user !== undefined) {
      loadSavedProgress()
    }
  }, [user, dataLoaded])

  const fetchOfferedTerms = async () => {
    // Check cache first
    if (apiCache.offeredTerms) {
      setOfferedTerms(apiCache.offeredTerms)
      setDataLoaded(true)
      return
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/offered_terms/`, {
        credentials: 'include'
      })
      const data = await response.json()
      setOfferedTerms(data)
      if (data.length > 0) {
        setSelectedTerm(data[0])
      }
      
      // Cache the response
      setApiCache(prev => ({ ...prev, offeredTerms: data }))
      setDataLoaded(true)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load terms' })
      setDataLoaded(true)
    }
  }

  const loadSavedProgress = async () => {
    if (!user) return // Only load for authenticated users
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/user_progress/`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.courses && data.courses.length > 0) {
          restoreProgressData(data)
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const restoreProgressData = async (data) => {
    if (data.offered_term) {
      setSelectedTerm(data.offered_term)
    }
    if (data.courses) {
      const restoredCourses = []
      
      for (let i = 0; i < data.courses.length; i++) {
        const course = data.courses[i]
        const newCourse = {
          id: Date.now() + i,
          course_type: course.course_type,
          course_code: course.course_code,
          section_number: course.section_number,
          courseTypes: [],
          courseCodes: [],
          sectionNumbers: [],
          events: [],
          assessments: course.assessments || []
        }
        
        // Load course data progressively
        await loadCourseDataForRestore(newCourse, data.offered_term)
        restoredCourses.push(newCourse)
      }
      
      setCourses(restoredCourses)
    }
    if (data.combinations || data.best_combination) {
      setResults(data)
    }
  }

  const loadCourseDataForRestore = async (course, offeredTerm) => {
    try {
      // Load course types
      const courseTypes = await fetchCourseTypesForRestore(offeredTerm)
      course.courseTypes = courseTypes
      
      if (course.course_type) {
        // Load course codes
        const courseCodes = await fetchCourseCodesForRestore(offeredTerm, course.course_type)
        course.courseCodes = courseCodes
        
        if (course.course_code) {
          // Load section numbers
          const sectionNumbers = await fetchSectionNumbersForRestore(offeredTerm, course.course_type, course.course_code)
          course.sectionNumbers = sectionNumbers
          
          if (course.section_number) {
            // Load course events
            const events = await fetchCourseEventsForRestore(offeredTerm, course.course_type, course.course_code, course.section_number)
            course.events = events
          }
        }
      }
    } catch (error) {
      console.error('Error loading course data for restore:', error)
    }
  }

  const fetchCourseTypesForRestore = async (offeredTerm) => {
    const cacheKey = offeredTerm
    if (apiCache.courseTypes[cacheKey]) {
      return apiCache.courseTypes[cacheKey]
    }

    const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_types/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offered_term: offeredTerm })
    })
    const data = await response.json()
    
    setApiCache(prev => ({
      ...prev,
      courseTypes: { ...prev.courseTypes, [cacheKey]: data }
    }))
    
    return data
  }

  const fetchCourseCodesForRestore = async (offeredTerm, courseType) => {
    const cacheKey = `${offeredTerm}-${courseType}`
    if (apiCache.courseCodes[cacheKey]) {
      return apiCache.courseCodes[cacheKey]
    }

    const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_codes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offered_term: offeredTerm, course_type: courseType })
    })
    const data = await response.json()
    
    setApiCache(prev => ({
      ...prev,
      courseCodes: { ...prev.courseCodes, [cacheKey]: data }
    }))
    
    return data
  }

  const fetchSectionNumbersForRestore = async (offeredTerm, courseType, courseCode) => {
    const cacheKey = `${offeredTerm}-${courseType}-${courseCode}`
    if (apiCache.sectionNumbers[cacheKey]) {
      return apiCache.sectionNumbers[cacheKey]
    }

    const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/section_numbers/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offered_term: offeredTerm, course_type: courseType, course_code: courseCode })
    })
    const data = await response.json()
    
    setApiCache(prev => ({
      ...prev,
      sectionNumbers: { ...prev.sectionNumbers, [cacheKey]: data }
    }))
    
    return data
  }

  const fetchCourseEventsForRestore = async (offeredTerm, courseType, courseCode, sectionNumber) => {
    const cacheKey = `${offeredTerm}-${courseType}-${courseCode}-${sectionNumber}`
    if (apiCache.courseEvents[cacheKey]) {
      return apiCache.courseEvents[cacheKey]
    }

    const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_events/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offered_term: offeredTerm, course_type: courseType, course_code: courseCode, section_number: sectionNumber })
    })
    const data = await response.json()
    
    setApiCache(prev => ({
      ...prev,
      courseEvents: { ...prev.courseEvents, [cacheKey]: data }
    }))
    
    return data
  }

  const addCourse = () => {
    // Close all existing courses and add new one at the end
    const newCourse = {
      id: Date.now(),
      course_type: '',
      course_code: '',
      section_number: '',
      courseTypes: [],
      courseCodes: [],
      sectionNumbers: [],
      events: [],
      assessments: []
    }
    
    setCourses(prevCourses => [...prevCourses, newCourse])
    
    // Scroll to the new course after a short delay
    setTimeout(() => {
      const newCourseElement = document.querySelector(`[data-course-id="${newCourse.id}"]`)
      if (newCourseElement) {
        newCourseElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const removeCourse = (courseId) => {
    setCourses(prevCourses => {
      const newCourses = prevCourses.filter(course => course.id !== courseId)
      // Reset expansion state for remaining courses
      return newCourses.map((course, index) => ({
        ...course,
        // Keep first course expanded if only one remains, otherwise keep compact
        isExpanded: newCourses.length === 1 ? true : false
      }))
    })
  }

  const updateCourse = (courseId, field, value) => {
    setCourses(prevCourses => prevCourses.map(course => 
      course.id === courseId 
        ? { ...course, [field]: value }
        : course
    ))
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

  const fetchCourseTypes = async (courseId) => {
    if (!selectedTerm) return
    
    // Check cache first
    const cacheKey = selectedTerm
    if (apiCache.courseTypes[cacheKey]) {
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, courseTypes: apiCache.courseTypes[cacheKey] }
          : course
      ))
      return
    }
    
    try {
      setIsLoading(true)
      const csrfToken = getCsrfToken()
      
      const headers = { 'Content-Type': 'application/json' }
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_types/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ offered_term: selectedTerm })
      })
      const data = await response.json()
      
      // Cache the response
      setApiCache(prev => ({
        ...prev,
        courseTypes: { ...prev.courseTypes, [cacheKey]: data }
      }))
      
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, courseTypes: data }
          : course
      ))
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load course types' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourseCodes = async (courseId, courseType) => {
    if (!selectedTerm || !courseType) return
    
    // Check cache first
    const cacheKey = `${selectedTerm}-${courseType}`
    if (apiCache.courseCodes[cacheKey]) {
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, courseCodes: apiCache.courseCodes[cacheKey], course_code: '', section_number: '', events: [] }
          : course
      ))
      return
    }
    
    try {
      setIsLoading(true)
      const csrfToken = getCsrfToken()
      
      const headers = { 'Content-Type': 'application/json' }
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_codes/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          course_type: courseType 
        })
      })
      const data = await response.json()
      
      // Cache the response
      setApiCache(prev => ({
        ...prev,
        courseCodes: { ...prev.courseCodes, [cacheKey]: data }
      }))
      
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, courseCodes: data, course_code: '', section_number: '', events: [] }
          : course
      ))
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load course codes' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSectionNumbers = async (courseId, courseType, courseCode) => {
    if (!selectedTerm || !courseType || !courseCode) return
    
    // Check cache first
    const cacheKey = `${selectedTerm}-${courseType}-${courseCode}`
    if (apiCache.sectionNumbers[cacheKey]) {
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, sectionNumbers: apiCache.sectionNumbers[cacheKey], section_number: '', events: [] }
          : course
      ))
      return
    }
    
    try {
      setIsLoading(true)
      const csrfToken = getCsrfToken()
      
      const headers = { 'Content-Type': 'application/json' }
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/section_numbers/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          course_type: courseType,
          course_code: courseCode
        })
      })
      const data = await response.json()
      
      // Cache the response
      setApiCache(prev => ({
        ...prev,
        sectionNumbers: { ...prev.sectionNumbers, [cacheKey]: data }
      }))
      
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, sectionNumbers: data, section_number: '', events: [] }
          : course
      ))
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load section numbers' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourseEvents = async (courseId, courseType, courseCode, sectionNumber) => {
    if (!selectedTerm || !courseType || !courseCode || !sectionNumber) return
    
    // Check cache first
    const cacheKey = `${selectedTerm}-${courseType}-${courseCode}-${sectionNumber}`
    if (apiCache.courseEvents[cacheKey]) {
      const events = apiCache.courseEvents[cacheKey]
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              events: events,
              assessments: events.map(event => ({
                event_id: event.id,
                achieved: ''
              }))
            }
          : course
      ))
      return
    }
    
    try {
      setIsLoading(true)
      const csrfToken = getCsrfToken()
      
      const headers = { 'Content-Type': 'application/json' }
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/course_events/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ 
          offered_term: selectedTerm,
          course_type: courseType,
          course_code: courseCode,
          section_number: sectionNumber
        })
      })
      const data = await response.json()
      
      // Cache the response
      setApiCache(prev => ({
        ...prev,
        courseEvents: { ...prev.courseEvents, [cacheKey]: data }
      }))
      
      setCourses(prevCourses => prevCourses.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              events: data,
              assessments: data.map(event => ({
                event_id: event.id,
                achieved: ''
              }))
            }
          : course
      ))
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load course events' })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAssessment = (courseId, eventId, value) => {
    setCourses(prevCourses => prevCourses.map(course => 
      course.id === courseId 
        ? {
            ...course,
            assessments: course.assessments.map(assessment =>
              assessment.event_id === eventId
                ? { ...assessment, achieved: value }
                : assessment
            )
          }
        : course
    ))
  }

  const calculateGPA = async () => {
    if (courses.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one course' })
      return
    }

    // Validate all courses have required data
    for (const course of courses) {
      if (!course.course_type || !course.course_code || !course.section_number) {
        setMessage({ type: 'error', text: 'Please complete all course selections' })
        return
      }
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const csrfToken = getCsrfToken()
      
      const payload = {
        offered_term: selectedTerm,
        courses: courses.map(course => ({
          course_type: course.course_type,
          course_code: course.course_code,
          section_number: course.section_number,
          assessments: course.assessments
            .filter(assessment => {
              const grade = assessment.achieved
              return grade !== '' && grade !== null && grade !== undefined && !isNaN(parseFloat(grade))
            })
            .map(assessment => ({
              event_id: assessment.event_id,
              achieved: parseFloat(assessment.achieved)
            }))
        }))
      }

      const headers = { 
        'Content-Type': 'application/json',
      }
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }

      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/calculate/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResults(data)
        setMessage({ type: 'success', text: 'GPA calculated successfully!' })
        
        // Scroll to results after a short delay
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        setMessage({ type: 'error', text: data.error || 'Calculation failed' })
      }
    } catch (error) {
      console.error('API Error:', error)
      setMessage({ type: 'error', text: `Network error: ${error.message}. Please check that the backend server is running.` })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = async () => {
    try {
      const csrfToken = getCsrfToken()
      
      const headers = {}
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(`${BACKEND_API_URL}/api/gpacalc/progress_export_excel/`, {
        credentials: 'include',
        headers: headers
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'gpa_calculation.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Excel file downloaded successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Export failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed' })
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
      <Navbar />
      
      {/* Header Section */}
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
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
                GPA Calculator
              </h1>
            </div>
            
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Calculate your GPA with multiple grading schemes and export detailed reports. 
              Add your courses and assessment grades to get accurate predictions.
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
                <p className="text-sm text-neutral-600">Choose your term and add courses by selecting course type, code, and section.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>Enter Available Grades</h3>
                <p className="text-sm text-neutral-600">Input grades you have received so far. Leave blank for future assessments.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#456882' }}>
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#456882' }}>Calculate & Export</h3>
                <p className="text-sm text-neutral-600">Get your current GPA with optimal grading schemes and export detailed Excel reports.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Message Display */}
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

          {/* Courses Section */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#456882' }}>
                Courses
              </h2>
              
              <motion.button
                onClick={addCourse}
                disabled={!selectedTerm}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" />
                <span>Add Course</span>
              </motion.button>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">No courses added yet. Click "Add Course" to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={index}
                    selectedTerm={selectedTerm}
                    isLoading={isLoading}
                    isCompact={courses.length > 1}
                    onRemove={() => removeCourse(course.id)}
                    onUpdate={(field, value) => updateCourse(course.id, field, value)}
                    onFetchCourseTypes={() => fetchCourseTypes(course.id)}
                    onFetchCourseCodes={(courseType) => fetchCourseCodes(course.id, courseType)}
                    onFetchSectionNumbers={(courseType, courseCode) => fetchSectionNumbers(course.id, courseType, courseCode)}
                    onFetchCourseEvents={(courseType, courseCode, sectionNumber) => fetchCourseEvents(course.id, courseType, courseCode, sectionNumber)}
                    onUpdateAssessment={(eventId, value) => updateAssessment(course.id, eventId, value)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Calculate Button */}
          {courses.length > 0 && (
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                onClick={calculateGPA}
                disabled={isLoading}
                className="px-8 py-4 rounded-lg font-bold text-white text-lg flex items-center space-x-3 mx-auto hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#456882' }}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Calculating...' : 'Calculate GPA'}</span>
              </motion.button>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <motion.div
              ref={resultsRef}
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Best Combination Highlight */}
              {results.best_combination && (
                <motion.div
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Award className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-xl font-bold text-green-800">Best Grading Scheme Combination</h3>
                    </div>
                    
                    <motion.button
                      onClick={exportToExcel}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300"
                      style={{ backgroundColor: '#456882' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Excel</span>
                    </motion.button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {results.best_combination.overall_gpa}
                      </div>
                      <div className="text-sm text-green-700">Overall GPA</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {results.best_combination.overall_final_percentage}%
                      </div>
                      <div className="text-sm text-green-700">Final Percentage</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {results.total_credit}
                      </div>
                      <div className="text-sm text-green-700">Total Credits</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {results.best_combination.per_course?.map((course, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div>
                          <span className="font-semibold">{course.course}</span>
                          <span className="text-sm text-neutral-600 ml-2">({course.scheme_name})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{course.letter_grade} ({course.gpa_value})</div>
                          <div className="text-sm text-neutral-600">{course.final_percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* All Combinations */}
              {results.combinations && results.combinations.length > 1 && (
                <motion.div
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center mb-4">
                    <BarChart3 className="w-6 h-6 mr-2" style={{ color: '#456882' }} />
                    <h3 className="text-xl font-bold" style={{ color: '#456882' }}>
                      All Grading Scheme Combinations
                    </h3>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {results.combinations.map((combo, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          combo.scheme_id === results.best_combination?.scheme_id
                            ? 'bg-green-50 border-green-200'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              Combination {index + 1}
                              {combo.scheme_id === results.best_combination?.scheme_id && (
                                <span className="ml-2 text-green-600 text-sm">(Best)</span>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600">{combo.scheme_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">GPA: {combo.overall_gpa}</div>
                            <div className="text-sm text-neutral-600">{combo.overall_final_percentage}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Individual Schemes */}
              {results.individual_schemes && results.individual_schemes.length > 0 && (
                <motion.div
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#456882' }}>
                    Individual Course Schemes
                  </h3>
                  
                  <div className="space-y-4">
                    {results.individual_schemes.map((scheme, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{scheme.course}</div>
                            <div className="text-sm text-neutral-600">{scheme.scheme_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{scheme.letter_grade} ({scheme.gpa_value})</div>
                            <div className="text-sm text-neutral-600">{scheme.final_percentage}%</div>
                          </div>
                        </div>
                        
                        {scheme.weightages && Object.keys(scheme.weightages).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-neutral-200">
                            <div className="text-xs text-neutral-500 mb-1">Assessment Weights:</div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(scheme.weightages).map(([assessment, weight]) => (
                                <span key={assessment} className="text-xs bg-neutral-200 px-2 py-1 rounded">
                                  {assessment}: {weight}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}

// Course Card Component with Compact Mode
const CourseCard = ({ 
  course, 
  index, 
  selectedTerm,
  isLoading,
  isCompact,
  onRemove, 
  onUpdate, 
  onFetchCourseTypes,
  onFetchCourseCodes,
  onFetchSectionNumbers,
  onFetchCourseEvents,
  onUpdateAssessment
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact)

  useEffect(() => {
    if (selectedTerm && course.courseTypes.length === 0) {
      onFetchCourseTypes()
    }
  }, [selectedTerm])

  // Auto-expand when course is newly added (last in the list)
  useEffect(() => {
    if (index === 0 && !isCompact) {
      setIsExpanded(true)
    }
  }, [index, isCompact])

  return (
    <motion.div
      data-course-id={course.id}
      className="border border-neutral-200 rounded-lg bg-neutral-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Course Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold" style={{ color: '#456882' }}>
            Course {index + 1}
          </h3>
          {course.course_type && course.course_code && course.section_number && (
            <span className="text-sm text-neutral-600 bg-neutral-200 px-2 py-1 rounded">
              {course.course_type}*{course.course_code}*{course.section_number}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isCompact && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </motion.button>
          )}
          
          <motion.button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Course Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {/* Course Selection */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Course Type
                  </label>
                  <select
                    value={course.course_type}
                    onChange={(e) => {
                      onUpdate('course_type', e.target.value)
                      if (e.target.value) {
                        onFetchCourseCodes(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': '#456882' }}
                  >
                    <option value="">Select Type</option>
                    {course.courseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Course Code
                  </label>
                  <select
                    value={course.course_code}
                    onChange={(e) => {
                      onUpdate('course_code', e.target.value)
                      if (e.target.value) {
                        onFetchSectionNumbers(course.course_type, e.target.value)
                      }
                    }}
                    disabled={!course.course_type}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                    style={{ '--tw-ring-color': '#456882' }}
                  >
                    <option value="">Select Code</option>
                    {course.courseCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Section
                  </label>
                  <select
                    value={course.section_number}
                    onChange={(e) => {
                      onUpdate('section_number', e.target.value)
                      if (e.target.value) {
                        onFetchCourseEvents(course.course_type, course.course_code, e.target.value)
                      }
                    }}
                    disabled={!course.course_code}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                    style={{ '--tw-ring-color': '#456882' }}
                  >
                    <option value="">Select Section</option>
                    {course.sectionNumbers.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assessments */}
              {course.events.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: '#456882' }}>
                    Assessment Grades (Enter grades you have received)
                  </h4>
                  
                  <div className="space-y-3">
                    {course.events.map((event) => (
                      <div key={event.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{event.event_type}</div>
                          <div className="text-sm text-neutral-600">Weight: {event.weightage}</div>
                          {event.event_date && (
                            <div className="text-xs text-neutral-500">Date: {event.event_date}</div>
                          )}
                        </div>
                        
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Grade %"
                            value={course.assessments.find(a => a.event_id === event.id)?.achieved || ''}
                            onChange={(e) => onUpdateAssessment(event.id, e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ '--tw-ring-color': '#456882' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Info className="w-4 h-4 inline mr-1" />
                      GPA is calculated based only on completed assessments. Leave blank for future assessments.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default GPACalculatorPage