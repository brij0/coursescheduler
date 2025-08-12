import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Users,
  Hash,
  Send,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import api from "../contexts/API";

const ConflictFreeSchedulePage = () => {
  const { user } = useAuth();
  const [offeredTerms, setOfferedTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [availableCourses, setAvailableCourses] = useState({});
  const [availableSections, setAvailableSections] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' or 'list'
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
    hasMore: false,
    total: "unknown",
    currentBatch: 0,
  });
  const [selectedScheduleForView, setSelectedScheduleForView] = useState(null);
  const resultsRef = useRef(null);
  const [courseColors, setCourseColors] = useState({});

  // Course selection state - updated to include section
  const [newCourse, setNewCourse] = useState({
    course_type: "",
    course_code: "",
    course_section: "",
  });

  const [allSchedules, setAllSchedules] = useState([]); // Store all schedules from backend
  const [filteredSchedules, setFilteredSchedules] = useState([]); // Currently displayed schedules
  const [activeFilters, setActiveFilters] = useState({
    sortBy: "none", // 'none', 'fewestDays', 'mostDays', 'earliest', 'latest', 'clustered', 'spread'
    timePreference: "any", // 'morning', 'afternoon', 'evening', 'any'
    maxDays: 5,
    minGapBetweenClasses: 0, // in hours
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch offered terms on component mount
  useEffect(() => {
    fetchOfferedTerms();
  }, []);

  // Fetch course types when term is selected and reset dependent fields
  useEffect(() => {
    if (selectedTerm) {
      fetchCourseTypes();
      // Reset course selection when term changes
      setNewCourse({ course_type: "", course_code: "", course_section: "" });
      // Clear cached data for the previous term
      setAvailableCourses({});
      setAvailableSections({});
      setCourseTypes([]);
    }
  }, [selectedTerm]);

  // Auto-fetch course codes when course type is selected
  useEffect(() => {
    if (
      selectedTerm &&
      newCourse.course_type &&
      !availableCourses[newCourse.course_type]
    ) {
      fetchCourseCodes(newCourse.course_type);
    }
  }, [selectedTerm, newCourse.course_type, availableCourses]);

  // Auto-fetch section numbers when course code is selected
  useEffect(() => {
    if (selectedTerm && newCourse.course_type && newCourse.course_code) {
      const sectionKey = `${newCourse.course_type}_${newCourse.course_code}`;
      if (!availableSections[sectionKey]) {
        fetchSectionNumbers(newCourse.course_type, newCourse.course_code);
      }
    }
  }, [
    selectedTerm,
    newCourse.course_type,
    newCourse.course_code,
    availableSections,
  ]);

  // Scroll detection for infinite loading
  const handleScroll = useCallback(() => {
    if (isLoading || !pagination.hasMore || schedules.length === 0) return;

    const scrollPosition =
      window.innerHeight + document.documentElement.scrollTop;
    const scrollThreshold = document.documentElement.offsetHeight - 1000; // Load when 1000px from bottom

    if (scrollPosition >= scrollThreshold) {
      generateSchedules(true); // Load more schedules
    }
  }, [isLoading, pagination.hasMore, schedules.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const fetchOfferedTerms = async () => {
    try {
      const data = await api.fetchOfferedTerms(false);
      setOfferedTerms(data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch offered terms" });
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const data = await api.fetchCourseTypes(selectedTerm, false);
      setCourseTypes(data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch course types" });
    }
  };

  const fetchCourseCodes = async (courseType) => {
    try {
      const data = await api.fetchCourseCodes(selectedTerm, courseType, false);
      if (!availableCourses[courseType]) {
        setAvailableCourses((prev) => ({ ...prev, [courseType]: data }));
      }
      return data;
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch course codes" });
      return [];
    }
  };

  const fetchSectionNumbers = async (courseType, courseCode) => {
    try {
      const data = await api.fetchSectionNumbers(
        selectedTerm,
        courseType,
        courseCode,
        false
      );
      const sectionKey = `${courseType}_${courseCode}`;
      setAvailableSections((prev) => ({ ...prev, [sectionKey]: data }));
      return data;
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch section numbers" });
      return [];
    }
  };

  const addCourse = async () => {
    if (!newCourse.course_type || !newCourse.course_code) {
      setMessage({ type: "error", text: "Please select course type and code" });
      return;
    }

    const courseKey = `${newCourse.course_type}*${newCourse.course_code}`;

    if (
      selectedCourses.some(
        (c) => `${c.course_type}*${c.course_code}` === courseKey
      )
    ) {
      setMessage({ type: "error", text: "Course already added" });
      return;
    }

    const courseToAdd = {
      course_type: newCourse.course_type,
      course_code: newCourse.course_code,
    };

    if (newCourse.course_section) {
      courseToAdd.course_section = newCourse.course_section;
    }

    setSelectedCourses((prev) => [...prev, courseToAdd]);
    setNewCourse({ course_type: "", course_code: "", course_section: "" });
    setMessage({ type: "success", text: "Course added successfully" });

    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const removeCourse = (index) => {
    setSelectedCourses((prev) => prev.filter((_, i) => i !== index));
    setSchedules([]);
    setCurrentScheduleIndex(0);
    setPagination({
      offset: 0,
      limit: 50,
      hasMore: false,
      total: "unknown",
      currentBatch: 0,
    });
  };

  const saveSchedulesToStorage = (schedules, term, courses) => {
    try {
      const storageKey = `schedules_${term}`;
      const scheduleData = {
        schedules,
        timestamp: Date.now(),
        term,
        courses: courses.map((c) => ({
          course_type: c.course_type,
          course_code: c.course_code,
          course_section: c.course_section || null,
        })),
      };
      localStorage.setItem(storageKey, JSON.stringify(scheduleData));
    } catch (error) {
      console.error("Failed to save schedules to localStorage:", error);
    }
  };

  const loadSchedulesFromStorage = (term, selectedCourses) => {
    try {
      const storageKey = `schedules_${term}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsedData = JSON.parse(data);
        // Check if data is less than 1 hour old
        if (Date.now() - parsedData.timestamp < 3600000) {
          // Check if selected courses match cached courses
          const cachedCourses = parsedData.courses || [];
          const currentCourses = selectedCourses.map((c) => ({
            course_type: c.course_type,
            course_code: c.course_code,
            course_section: c.course_section || null,
          }));

          // Compare courses (order doesn't matter)
          const coursesMatch =
            cachedCourses.length === currentCourses.length &&
            cachedCourses.every((cached) =>
              currentCourses.some(
                (current) =>
                  current.course_type === cached.course_type &&
                  current.course_code === cached.course_code &&
                  current.course_section === cached.course_section
              )
            );

          if (coursesMatch) {
            return parsedData.schedules;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to load schedules from localStorage:", error);
      return null;
    }
  };

  const parseTimeToMinutes = (timeStr) => {
    try {
      const time = timeStr.split("-")[0].trim();
      const [timePart, period] =
        time.includes("AM") || time.includes("PM")
          ? [
              time.replace(/AM|PM/, "").trim(),
              time.includes("PM") ? "PM" : "AM",
            ]
          : [time, "AM"];

      let [hour, minute = 0] = timePart.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    } catch {
      return 0;
    }
  };

  const getScheduleStats = (schedule) => {
    const days = new Set();
    const times = [];
    let totalEvents = 0;

    Object.values(schedule).forEach((courseEvents) => {
      courseEvents.forEach((event) => {
        totalEvents++;
        if (event.days) {
          event.days
            .toLowerCase()
            .split(/[,\s]+/)
            .forEach((day) => {
              if (day && day.length >= 2) days.add(day.substring(0, 3));
            });
        }
        if (event.times) {
          const startMinutes = parseTimeToMinutes(event.times);
          const endTime = event.times.split("-")[1]?.trim();
          const endMinutes = endTime
            ? parseTimeToMinutes(
                endTime +
                  (endTime.includes("AM") || endTime.includes("PM")
                    ? ""
                    : " PM")
              )
            : startMinutes + 60;
          times.push({ start: startMinutes, end: endMinutes });
        }
      });
    });

    times.sort((a, b) => a.start - b.start);

    const earliestTime =
      times.length > 0 ? Math.min(...times.map((t) => t.start)) : 0;
    const latestTime =
      times.length > 0 ? Math.max(...times.map((t) => t.end)) : 0;

    // Calculate gaps between classes
    let totalGapTime = 0;
    let gapCount = 0;
    for (let i = 1; i < times.length; i++) {
      const gap = times[i].start - times[i - 1].end;
      if (gap > 0) {
        totalGapTime += gap;
        gapCount++;
      }
    }

    const avgGap = gapCount > 0 ? totalGapTime / gapCount : 0;
    const timeSpread = latestTime - earliestTime;

    return {
      daysCount: days.size,
      days: Array.from(days),
      earliestTime,
      latestTime,
      timeSpread,
      avgGap,
      totalEvents,
      times,
    };
  };

  const applyFilters = (schedules) => {
    if (!schedules || schedules.length === 0) return [];

    let filtered = [...schedules];

    // Apply time preference filter
    if (activeFilters.timePreference !== "any") {
      filtered = filtered.filter((schedule) => {
        const stats = getScheduleStats(schedule);
        const avgTime = (stats.earliestTime + stats.latestTime) / 2;

        switch (activeFilters.timePreference) {
          case "morning":
            return avgTime < 12 * 60; // Before noon
          case "afternoon":
            return avgTime >= 12 * 60 && avgTime < 17 * 60; // Noon to 5 PM
          case "evening":
            return avgTime >= 17 * 60; // After 5 PM
          default:
            return true;
        }
      });
    }

    // Apply max days filter
    filtered = filtered.filter((schedule) => {
      const stats = getScheduleStats(schedule);
      return stats.daysCount <= activeFilters.maxDays;
    });

    // Apply minimum gap filter
    if (activeFilters.minGapBetweenClasses > 0) {
      filtered = filtered.filter((schedule) => {
        const stats = getScheduleStats(schedule);
        return stats.avgGap >= activeFilters.minGapBetweenClasses * 60;
      });
    }

    // Apply sorting
    if (activeFilters.sortBy !== "none") {
      filtered.sort((a, b) => {
        const statsA = getScheduleStats(a);
        const statsB = getScheduleStats(b);

        switch (activeFilters.sortBy) {
          case "fewestDays":
            return statsA.daysCount - statsB.daysCount;
          case "mostDays":
            return statsB.daysCount - statsA.daysCount;
          case "earliest":
            return statsA.earliestTime - statsB.earliestTime;
          case "latest":
            return statsB.latestTime - statsA.latestTime;
          case "clustered":
            return statsA.timeSpread - statsB.timeSpread;
          case "spread":
            return statsB.timeSpread - statsA.timeSpread;
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const generateSchedules = async (loadMore = false) => {
    if (selectedCourses.length === 0) {
      setMessage({ type: "error", text: "Please add at least one course" });
      return;
    }

    setIsLoading(true);
    try {
      let allSchedulesData = [];

      if (!loadMore) {
        // Try to load from storage first with course validation
        const cachedSchedules = loadSchedulesFromStorage(
          selectedTerm,
          selectedCourses
        );
        if (cachedSchedules && cachedSchedules.length > 0) {
          allSchedulesData = cachedSchedules;
        } else {
          // Clear existing schedules when starting fresh
          setSchedules([]);
          setAllSchedules([]);

          // Fetch schedules from backend in batches and show immediately
          let offset = 0;
          let hasMore = true;
          let firstBatch = true;

          while (hasMore) {
            const data = await api.generateSchedules(
              selectedCourses,
              selectedTerm,
              offset,
              100 // Larger batch size for fetching all
            );

            if (data.schedules && data.schedules.length > 0) {
              allSchedulesData = [...allSchedulesData, ...data.schedules];

              // Show schedules immediately after first batch
              if (firstBatch) {
                // Assign colors to courses
                assignCourseColors(data.schedules);

                // Apply filters and set displayed schedules
                const filtered = applyFilters(data.schedules);
                setFilteredSchedules(filtered);
                setSchedules(filtered.slice(0, pagination.limit));
                setAllSchedules(data.schedules);

                setMessage({
                  type: "success",
                  text: `Found ${data.schedules.length} schedules so far... Loading more`,
                });

                // Scroll to results
                setTimeout(() => {
                  if (resultsRef.current) {
                    resultsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);

                firstBatch = false;
              } else {
                // Update with additional schedules
                setAllSchedules((prev) => {
                  const updated = [...prev, ...data.schedules];
                  // Update colors for new schedules
                  assignCourseColors(updated);

                  // Reapply filters with all schedules
                  const filtered = applyFilters(updated);
                  setFilteredSchedules(filtered);
                  setSchedules(filtered.slice(0, pagination.limit));

                  return updated;
                });
              }

              offset += data.schedules.length;
              hasMore = data.has_more;
            } else {
              hasMore = false;
            }
          }

          // Save to localStorage with courses
          saveSchedulesToStorage(
            allSchedulesData,
            selectedTerm,
            selectedCourses
          );
        }

        // If we loaded from cache, process normally
        if (allSchedulesData === cachedSchedules) {
          setAllSchedules(allSchedulesData);

          // Assign colors to courses
          if (allSchedulesData.length > 0) {
            assignCourseColors(allSchedulesData);
          }

          // Apply filters and set displayed schedules
          const filtered = applyFilters(allSchedulesData);
          setFilteredSchedules(filtered);
          setSchedules(filtered.slice(0, pagination.limit));
        }

        setCurrentScheduleIndex(0);
        setPagination({
          offset: 0,
          limit: pagination.limit,
          hasMore:
            (filteredSchedules.length ||
              applyFilters(allSchedulesData).length) > pagination.limit,
          total:
            filteredSchedules.length || applyFilters(allSchedulesData).length,
          currentBatch: 1,
        });

        // Final success message
        const finalFiltered =
          filteredSchedules.length > 0
            ? filteredSchedules
            : applyFilters(allSchedulesData);
        setMessage({
          type: "success",
          text: `Found ${allSchedulesData.length} total schedules (${finalFiltered.length} after filtering)`,
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        // Load more from filtered results (existing code)
        const currentLength = schedules.length;
        const nextBatch = filteredSchedules.slice(
          currentLength,
          currentLength + pagination.limit
        );

        setSchedules((prev) => [...prev, ...nextBatch]);
        setPagination((prev) => ({
          offset: prev.offset + pagination.limit,
          limit: prev.limit,
          hasMore: currentLength + nextBatch.length < filteredSchedules.length,
          total: filteredSchedules.length,
          currentBatch: prev.currentBatch + 1,
        }));
      }
    } catch (error) {
      console.error("Error generating schedules:", error);
      setMessage({ type: "error", text: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (allSchedules.length > 0) {
      const filtered = applyFilters(allSchedules);
      setFilteredSchedules(filtered);
      setSchedules(filtered.slice(0, pagination.limit));
      setPagination((prev) => ({
        offset: 0,
        limit: prev.limit,
        hasMore: filtered.length > pagination.limit,
        total: filtered.length,
        currentBatch: 1,
      }));
    }
  }, [activeFilters, allSchedules]);

  const assignCourseColors = (schedules) => {
    const colors = [
      "bg-red-100 border-red-300 text-red-800",
      "bg-blue-100 border-blue-300 text-blue-800",
      "bg-green-100 border-green-300 text-green-800",
      "bg-purple-100 border-purple-300 text-purple-800",
      "bg-orange-100 border-orange-300 text-orange-800",
      "bg-pink-100 border-pink-300 text-pink-800",
      "bg-indigo-100 border-indigo-300 text-indigo-800",
      "bg-yellow-100 border-yellow-300 text-yellow-800",
      "bg-teal-100 border-teal-300 text-teal-800",
      "bg-gray-100 border-gray-300 text-gray-800",
    ];

    const uniqueCourseTypeCodes = new Set();
    schedules.forEach((schedule) => {
      Object.keys(schedule).forEach((courseKey) => {
        const courseTypeCode = courseKey.split("*").slice(0, 2).join("*");
        uniqueCourseTypeCodes.add(courseTypeCode);
      });
    });

    const sortedCourseTypeCodes = Array.from(uniqueCourseTypeCodes).sort();

    const newCourseColors = {};
    schedules.forEach((schedule) => {
      Object.keys(schedule).forEach((courseKey) => {
        if (!newCourseColors[courseKey]) {
          const courseTypeCode = courseKey.split("*").slice(0, 2).join("*");
          const index = sortedCourseTypeCodes.indexOf(courseTypeCode);
          newCourseColors[courseKey] = colors[index % colors.length];
        }
      });
    });

    setCourseColors((prev) => ({ ...prev, ...newCourseColors }));
  };

  const formatTime = (timeStr) => {
    return timeStr.replace("?", "-");
  };

  const getEventColor = (courseKey) => {
    if (!courseColors[courseKey]) {
      const colors = [
        "bg-red-100 border-red-300 text-red-800",
        "bg-blue-100 border-blue-300 text-blue-800",
        "bg-green-100 border-green-300 text-green-800",
        "bg-purple-100 border-purple-300 text-purple-800",
        "bg-orange-100 border-orange-300 text-orange-800",
        "bg-pink-100 border-pink-300 text-pink-800",
        "bg-indigo-100 border-indigo-300 text-indigo-800",
        "bg-yellow-100 border-yellow-300 text-yellow-800",
        "bg-teal-100 border-teal-300 text-teal-800",
        "bg-gray-100 border-gray-300 text-gray-800",
      ];

      const courseTypeCode = courseKey.split("*").slice(0, 2).join("*");
      const existingEntry = Object.entries(courseColors).find(
        ([key, color]) => {
          const keyTypeCode = key.split("*").slice(0, 2).join("*");
          return keyTypeCode === courseTypeCode;
        }
      );

      if (existingEntry) {
        const selectedColor = existingEntry[1];
        setCourseColors((prev) => ({ ...prev, [courseKey]: selectedColor }));
        return selectedColor;
      }

      const allCourseTypeCodes = new Set();
      Object.keys(courseColors).forEach((key) => {
        const typeCode = key.split("*").slice(0, 2).join("*");
        allCourseTypeCodes.add(typeCode);
      });

      const courseIndex = allCourseTypeCodes.size;
      const selectedColor = colors[courseIndex % colors.length];

      setCourseColors((prev) => ({ ...prev, [courseKey]: selectedColor }));
      return selectedColor;
    }
    return courseColors[courseKey];
  };

  const openFullScheduleView = (schedule, index) => {
    setSelectedScheduleForView({ schedule, index });
  };

  const closeFullScheduleView = () => {
    setSelectedScheduleForView(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F9FF" }}>
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
                style={{ backgroundColor: "#456882" }}
              >
                <Grid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: "#456882" }}>
                Build Conflict-Free Schedule
              </h1>
            </div>

            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Create conflict-free course schedules effortlessly. Select your
              courses and let our AI find the perfect timetable for you.
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
              <Info className="w-6 h-6 mr-3" style={{ color: "#456882" }} />
              <h2 className="text-2xl font-bold" style={{ color: "#456882" }}>
                How to Use Schedule Builder
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#456882" }}
                >
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#456882" }}>
                  Select Term & Courses
                </h3>
                <p className="text-sm text-neutral-600">
                  Choose your academic term and add the courses you want to
                  take. Optionally select specific sections.
                </p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#456882" }}
                >
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#456882" }}>
                  Generate Schedules
                </h3>
                <p className="text-sm text-neutral-600">
                  Our algorithm finds all possible conflict-free schedule
                  combinations. Scroll down to load more automatically.
                </p>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#456882" }}
                >
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#456882" }}>
                  Browse & Select
                </h3>
                <p className="text-sm text-neutral-600">
                  Browse through generated schedules and find the one that works
                  best for you.
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
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {message.type === "success" ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
                <button
                  onClick={() => setMessage({ type: "", text: "" })}
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
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "#456882" }}
            >
              Select Term
            </h2>

            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
              style={{ "--tw-ring-color": "#456882" }}
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
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "#456882" }}
            >
              Add Courses
            </h2>

            {/* Course Addition Form */}
            <div className="grid md:grid-cols-5 gap-4 mb-6">
              <select
                value={newCourse.course_type}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    course_type: e.target.value,
                    course_code: "",
                    course_section: "",
                  }))
                }
                disabled={!selectedTerm}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ "--tw-ring-color": "#456882" }}
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
                    course_section: "",
                  }))
                }
                disabled={!newCourse.course_type}
                className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ "--tw-ring-color": "#456882" }}
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
                style={{ "--tw-ring-color": "#456882" }}
              >
                <option value="">Any Section</option>
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
                disabled={!newCourse.course_type || !newCourse.course_code}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#456882" }}
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
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#456882" }}
                >
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
                style={{ backgroundColor: "#456882" }}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading && schedules.length === 0 ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
                <span>
                  {isLoading && schedules.length === 0
                    ? "Generating..."
                    : "Generate Schedules"}
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* Schedule Results */}
          {(schedules.length > 0 || allSchedules.length > 0) && (
            <motion.div
              ref={resultsRef}
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Filter Controls */}
              {allSchedules.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xl font-bold"
                      style={{ color: "#456882" }}
                    >
                      Filter & Sort Options
                    </h3>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-sm bg-neutral-200 text-neutral-700 px-3 py-1 rounded-lg hover:bg-neutral-300 transition-colors"
                    >
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <div className="mb-6">
                        <FilterControls
                          activeFilters={activeFilters}
                          setActiveFilters={setActiveFilters}
                          allSchedulesCount={allSchedules.length}
                          filteredCount={filteredSchedules.length}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* View Mode Toggle - Updated count display */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#456882" }}>
                  Schedule Options ({schedules.length}
                  {filteredSchedules.length !== allSchedules.length &&
                    ` of ${filteredSchedules.length} filtered`}
                  )
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "calendar"
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                    }`}
                    style={
                      viewMode === "calendar"
                        ? { backgroundColor: "#456882" }
                        : {}
                    }
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                    }`}
                    style={
                      viewMode === "list" ? { backgroundColor: "#456882" } : {}
                    }
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rest of the existing schedule display code remains the same */}
              {/* Schedule Grid Display */}
              <div className="space-y-8">
                {Array.from(
                  { length: Math.ceil(schedules.length / 3) },
                  (_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      {schedules
                        .slice(rowIndex * 3, (rowIndex + 1) * 3)
                        .map((schedule, scheduleIndex) => {
                          const globalIndex = rowIndex * 3 + scheduleIndex;
                          return (
                            <div
                              key={globalIndex}
                              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                              {/* Schedule Header */}
                              <div
                                className="p-4 border-b border-neutral-200"
                                style={{ backgroundColor: "#456882" }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-white font-semibold">
                                      Schedule {globalIndex + 1}
                                    </h4>
                                    <p className="text-white/80 text-xs">
                                      {Object.keys(schedule).length} course
                                      {Object.keys(schedule).length > 1
                                        ? "s"
                                        : ""}{" "}
                                      • {getScheduleStats(schedule).daysCount}{" "}
                                      days
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <motion.button
                                      onClick={() =>
                                        openFullScheduleView(
                                          schedule,
                                          globalIndex
                                        )
                                      }
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
                                {viewMode === "calendar" ? (
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
                          );
                        })}
                    </div>
                  )
                )}
              </div>

              {/* Loading indicator when loading more */}
              {isLoading && schedules.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-3 text-gray-600">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Loading more schedules...</span>
                  </div>
                </div>
              )}

              {/* End of results indicator */}
              {!pagination.hasMore && schedules.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    You've seen all available schedules ({schedules.length}{" "}
                    total)
                  </p>
                </div>
              )}
            </motion.div>
          )}
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
              <div
                className="p-6 border-b border-neutral-200"
                style={{ backgroundColor: "#456882" }}
              >
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
  );
};

// Enhanced Compact Schedule Calendar View Component - Made much more compact
const CompactScheduleCalendarView = ({
  schedule,
  getEventColor,
  showSectionInfo = false,
}) => {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timeSlots = Array.from({ length: 12 }, (_, i) => 8 + i); // 8 AM to 7 PM

  const parseTimeToMinutes = (timeStr) => {
    try {
      const time = timeStr.split("-")[0].trim();
      const [timePart, period] =
        time.includes("AM") || time.includes("PM")
          ? [
              time.replace(/AM|PM/, "").trim(),
              time.includes("PM") ? "PM" : "AM",
            ]
          : [time, "AM"];

      let [hour, minute = 0] = timePart.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    } catch {
      return 0;
    }
  };

  const parseEndTimeToMinutes = (timeStr) => {
    try {
      const timeRange = timeStr.split("-");
      if (timeRange.length < 2) return parseTimeToMinutes(timeStr) + 60; // Default 1 hour if no end time
      
      const endTime = timeRange[1].trim();
      const [timePart, period] =
        endTime.includes("AM") || endTime.includes("PM")
          ? [
              endTime.replace(/AM|PM/, "").trim(),
              endTime.includes("PM") ? "PM" : "AM",
            ]
          : [endTime, "PM"]; // Default to PM for end times without AM/PM

      let [hour, minute = 0] = timePart.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    } catch {
      return parseTimeToMinutes(timeStr) + 60;
    }
  };

  const getEventTimeSlots = (eventTime) => {
    const startMinutes = parseTimeToMinutes(eventTime);
    const endMinutes = parseEndTimeToMinutes(eventTime);
    const startHour = Math.floor(startMinutes / 60);
    const endHour = Math.floor(endMinutes / 60);
    
    const slots = [];
    for (let hour = startHour; hour <= endHour && hour >= 8 && hour <= 19; hour++) {
      const slotIndex = hour - 8;
      if (slotIndex >= 0 && slotIndex < 12) {
        slots.push({
          slotIndex,
          isStart: hour === startHour,
          isEnd: hour === endHour,
          duration: endHour - startHour + 1
        });
      }
    }
    return slots;
  };

  const getDayEvents = (day) => {
    const events = [];
    Object.entries(schedule).forEach(([courseKey, courseEvents]) => {
      courseEvents.forEach((event) => {
        if (
          event.days &&
          event.days.toLowerCase().includes(day.toLowerCase())
        ) {
          events.push({ ...event, courseKey });
        }
      });
    });
    return events;
  };

  // Get short event type for display
  const getShortEventType = (eventType) => {
    const typeMap = {
      Lecture: "LEC",
      Laboratory: "LAB",
      Lab: "LAB",
      Seminar: "SEM",
      Tutorial: "TUT",
      Practical: "PRAC",
      Discussion: "DISC",
      Recitation: "REC",
      Workshop: "WORK",
      Exam: "EXAM",
      "Final Exam": "FINAL",
      Quiz: "QUIZ"
    };
    return typeMap[eventType] || eventType.substring(0, 3).toUpperCase();
  };

  return (
    <div className="text-xs">
      {/* Course Legend - More Compact */}
      {showSectionInfo && (
        <div className="mb-2 p-2 bg-neutral-50 rounded text-xs">
          <div className="flex flex-wrap gap-1">
            {Object.keys(schedule).map((courseKey) => (
              <div key={courseKey} className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded ${getEventColor(
                    courseKey
                  )} border`}
                ></div>
                <span className="text-xs font-medium">
                  {courseKey.split("*")[0]}{courseKey.split("*")[1]}-{courseKey.split("*")[2]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-0 border border-gray-200 rounded overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-gray-50 p-1 text-center font-medium border-b text-xs">
          Time
        </div>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-1 text-center font-medium border-b border-l text-xs"
          >
            {day}
          </div>
        ))}

        {/* Time Slots */}
        {timeSlots.map((hour, timeIndex) => (
          <React.Fragment key={hour}>
            <div className="p-1 text-center bg-gray-50 border-b font-medium" style={{ fontSize: '10px' }}>
              {hour <= 12
                ? `${hour}:00 ${hour < 12 ? "AM" : "PM"}`
                : `${hour - 12}:00 PM`}
            </div>
            {daysOfWeek.map((day) => {
              const dayEvents = getDayEvents(day);
              const eventsInThisSlot = dayEvents.filter((event) => {
                const timeSlots = getEventTimeSlots(event.times);
                return timeSlots.some(slot => slot.slotIndex === timeIndex);
              });

              return (
                <div
                  key={`${day}-${hour}`}
                  className="border-b border-l min-h-[25px] relative"
                  style={{ padding: '1px' }}
                >
                  {eventsInThisSlot.map((event, idx) => {
                    const timeSlots = getEventTimeSlots(event.times);
                    const currentSlot = timeSlots.find(slot => slot.slotIndex === timeIndex);
                    
                    if (!currentSlot || !currentSlot.isStart) return null;

                    // Calculate exact position based on minutes
                    const startMinutes = parseTimeToMinutes(event.times);
                    const endMinutes = parseEndTimeToMinutes(event.times);
                    const startHour = Math.floor(startMinutes / 60);
                    const minutesIntoHour = startMinutes - (startHour * 60);
                    const totalDurationMinutes = endMinutes - startMinutes;
                    
                    // Calculate top offset as percentage of the hour slot
                    const topOffset = (minutesIntoHour / 60) * 25; // 25px is the min-height
                    // Calculate height based on actual duration
                    const eventHeight = Math.max((totalDurationMinutes / 60) * 25, 20); // Minimum 20px height
                    
                    return (
                      <div
                        key={idx}
                        className={`absolute inset-x-0 rounded border ${getEventColor(
                          event.courseKey
                        )} text-center overflow-hidden`}
                        style={{ 
                          top: `${topOffset}px`,
                          height: `${Math.min(eventHeight, 100)}px`, // Cap height to prevent overflow
                          fontSize: '9px',
                          lineHeight: '10px',
                          zIndex: 10
                        }}
                        title={`${event.courseKey} ${event.event_type} - ${
                          event.times
                        } ${event.location ? `at ${event.location}` : ""}`}
                      >
                        <div className="px-1 py-0.5">
                           <div className="font-semibold">
                            {getShortEventType(event.event_type)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Enhanced Compact Schedule List View Component
const CompactScheduleListView = ({
  schedule,
  getEventColor,
  formatTime,
  showSectionInfo = false,
}) => {
  return (
    <div className="space-y-3 text-xs">
      {Object.entries(schedule).map(([courseKey, events]) => (
        <div key={courseKey}>
          <h5
            className="font-semibold mb-2 text-sm flex items-center justify-between"
            style={{ color: "#456882" }}
          >
            <span>{courseKey.replace(/\*/g, " ")}</span>
            {showSectionInfo && (
              <span className="text-xs font-normal text-neutral-500">
                Section {courseKey.split("*")[2]}
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
  );
};

// Full Schedule View Component for Modal
const FullScheduleView = ({ schedule, getEventColor, formatTime }) => {
  const [viewMode, setViewMode] = useState("calendar");
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8);

  const parseTimeToMinutes = (timeStr) => {
    try {
      const time = timeStr.split("-")[0].trim();
      const [timePart, period] =
        time.includes("AM") || time.includes("PM")
          ? [
              time.replace(/AM|PM/, "").trim(),
              time.includes("PM") ? "PM" : "AM",
            ]
          : [time, "AM"];

      let [hour, minute = 0] = timePart.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    } catch {
      return 0;
    }
  };

  const getTimeSlot = (eventTime) => {
    const eventMinutes = parseTimeToMinutes(eventTime);
    const eventHour = Math.floor(eventMinutes / 60);
    return eventHour;
  };

  const getDayEvents = (day) => {
    const events = [];
    Object.entries(schedule).forEach(([courseKey, courseEvents]) => {
      courseEvents.forEach((event) => {
        if (
          event.days &&
          event.days.toLowerCase().includes(day.substring(0, 3).toLowerCase())
        ) {
          events.push({ ...event, courseKey });
        }
      });
    });
    return events;
  };

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: "#456882" }}>
          Detailed Schedule View
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === "calendar"
                ? "bg-primary-500 text-white"
                : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
            style={
              viewMode === "calendar" ? { backgroundColor: "#456882" } : {}
            }
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === "list"
                ? "bg-primary-500 text-white"
                : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
            style={viewMode === "list" ? { backgroundColor: "#456882" } : {}}
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
              <div
                className={`w-4 h-4 rounded ${getEventColor(
                  courseKey
                )} border-2`}
              ></div>
              <div>
                <div className="font-medium text-sm">
                  {courseKey.replace(/\*/g, " ")}
                </div>
                <div className="text-xs text-neutral-600"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Calendar or List View */}
      {viewMode === "calendar" ? (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-6 gap-0">
            {/* Header */}
            <div className="p-3 bg-neutral-100 border-b border-neutral-200 font-semibold text-center">
              Time
            </div>
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="p-3 bg-neutral-100 border-b border-neutral-200 font-semibold text-center"
              >
                {day}
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                <div className="p-3 border-b border-neutral-200 text-center bg-neutral-50 font-medium">
                  {hour <= 12
                    ? `${hour}:00 ${hour < 12 ? "AM" : "PM"}`
                    : `${hour - 12}:00 PM`}
                </div>
                {daysOfWeek.map((day) => {
                  const dayEvents = getDayEvents(day).filter((event) => {
                    const eventHour = getTimeSlot(event.times);
                    return eventHour === hour;
                  });

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="p-2 border-b border-neutral-200 min-h-[80px]"
                    >
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded mb-2 border-2 ${getEventColor(
                            event.courseKey
                          )}`}
                        >
                          <div className="font-semibold text-sm">
                            {event.courseKey.split("*")[0]}{" "}
                            {event.courseKey.split("*")[1]}
                          </div>
                          <div className="text-sm">{event.event_type}</div>
                          <div className="text-xs opacity-75">
                            {formatTime(event.times)}
                          </div>
                          {event.location && (
                            <div className="text-xs opacity-75 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(schedule).map(([courseKey, events]) => (
            <div
              key={courseKey}
              className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
            >
              <div className={`p-4 border-2 ${getEventColor(courseKey)}`}>
                <h4 className="font-bold text-lg">
                  {courseKey.replace(/\*/g, " ")}
                </h4>
                <p className="text-sm opacity-75">
                  Section {courseKey.split("*")[2]}
                </p>
              </div>
              <div className="p-4 space-y-3">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-2 ${getEventColor(
                        courseKey
                      )}`}
                    ></div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">
                        {event.event_type}
                      </div>
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
  );
};

const FilterControls = ({
  activeFilters,
  setActiveFilters,
  allSchedulesCount,
  filteredCount,
}) => {
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#456882" }}>
          Filter Schedules
        </h3>
        <div className="text-sm text-neutral-600">
          Showing {filteredCount} of {allSchedulesCount} schedules
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "#456882" }}
          >
            Sort By
          </label>
          <select
            value={activeFilters.sortBy}
            onChange={(e) =>
              setActiveFilters((prev) => ({ ...prev, sortBy: e.target.value }))
            }
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
            style={{ "--tw-ring-color": "#456882" }}
          >
            <option value="none">No Sorting</option>
            <option value="fewestDays">Fewest Days on Campus</option>
            <option value="mostDays">Most Days on Campus</option>
            <option value="earliest">Earliest Start Time</option>
            <option value="latest">Latest End Time</option>
            <option value="clustered">Most Clustered Classes</option>
            <option value="spread">Most Spread Out Classes</option>
          </select>
        </div>

        {/* Time Preference */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "#456882" }}
          >
            Time Preference
          </label>
          <select
            value={activeFilters.timePreference}
            onChange={(e) =>
              setActiveFilters((prev) => ({
                ...prev,
                timePreference: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
            style={{ "--tw-ring-color": "#456882" }}
          >
            <option value="any">Any Time</option>
            <option value="morning">Morning Heavy</option>
            <option value="afternoon">Afternoon Heavy</option>
            <option value="evening">Evening Heavy</option>
          </select>
        </div>

        {/* Max Days */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "#456882" }}
          >
            Max Days on Campus
          </label>
          <select
            value={activeFilters.maxDays}
            onChange={(e) =>
              setActiveFilters((prev) => ({
                ...prev,
                maxDays: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
            style={{ "--tw-ring-color": "#456882" }}
          >
            <option value={5}>5 Days</option>
            <option value={4}>4 Days</option>
            <option value={3}>3 Days</option>
            <option value={2}>2 Days</option>
          </select>
        </div>

        {/* Min Gap Between Classes */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "#456882" }}
          >
            Min Gap Between Classes
          </label>
          <select
            value={activeFilters.minGapBetweenClasses}
            onChange={(e) =>
              setActiveFilters((prev) => ({
                ...prev,
                minGapBetweenClasses: parseFloat(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm"
            style={{ "--tw-ring-color": "#456882" }}
          >
            <option value={0}>No Minimum</option>
            <option value={0.5}>30 Minutes</option>
            <option value={1}>1 Hour</option>
            <option value={1.5}>1.5 Hours</option>
            <option value={2}>2 Hours</option>
          </select>
        </div>
      </div>

      {/* Reset Filters */}
      <div className="mt-4 text-right">
        <button
          onClick={() =>
            setActiveFilters({
              sortBy: "none",
              timePreference: "any",
              maxDays: 5,
              minGapBetweenClasses: 0,
            })
          }
          className="px-4 py-2 text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </motion.div>
  );
};

export default ConflictFreeSchedulePage;
