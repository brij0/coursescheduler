import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, BookOpen } from 'lucide-react';

const SelectedCoursesList = ({
  courses,
  onRemoveCourse,
  showSections = false,
  title = "Selected Courses",
  emptyMessage = "No courses added yet.",
  emptySubMessage = "Click \"Add Course\" to get started."
}) => {
  if (courses.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
          <p className="text-neutral-500 mb-2">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-sm text-neutral-400">{emptySubMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#456882' }}>
        {title} ({courses.length})
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, index) => (
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
              {showSections && course.course_section && (
                <div className="text-sm text-neutral-600">
                  Section: {course.course_section}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemoveCourse(index)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SelectedCoursesList;