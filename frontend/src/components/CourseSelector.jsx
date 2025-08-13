import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Info } from 'lucide-react';

const CourseSelector = ({
  title = "Add Courses",
  newCourse,
  setNewCourse,
  courseTypes,
  availableCourses,
  availableSections,
  selectedTerm,
  onAddCourse,
  requiresSection = false,
  sectionLabel = "Select Section",
  infoMessage = null,
  disabled = false
}) => {
  const getSectionKey = () => {
    return `${newCourse.course_type}_${newCourse.course_code}`;
  };

  const isAddButtonDisabled = () => {
    if (!newCourse.course_type || !newCourse.course_code) return true;
    if (requiresSection && !newCourse.course_section) return true;
    return disabled;
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#456882' }}>
        {title}
      </h2>

      {/* Course Addition Form */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        {/* Course Type */}
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
          disabled={!selectedTerm || disabled}
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

        {/* Course Code */}
        <select
          value={newCourse.course_code}
          onChange={(e) =>
            setNewCourse((prev) => ({
              ...prev,
              course_code: e.target.value,
              course_section: '',
            }))
          }
          disabled={!newCourse.course_type || disabled}
          className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
          style={{ '--tw-ring-color': '#456882' }}
        >
          <option value="">Course Code</option>
          {availableCourses[newCourse.course_type]?.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        {/* Course Section */}
        <select
          value={newCourse.course_section}
          onChange={(e) =>
            setNewCourse((prev) => ({
              ...prev,
              course_section: e.target.value,
            }))
          }
          disabled={!newCourse.course_code || disabled}
          className="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
          style={{ '--tw-ring-color': '#456882' }}
        >
          <option value="">{sectionLabel}</option>
          {availableSections[getSectionKey()]?.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>

        {/* Add Button */}
        <motion.button
          onClick={onAddCourse}
          disabled={isAddButtonDisabled()}
          className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#456882' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Course</span>
        </motion.button>
      </div>

      {/* Info Message */}
      {infoMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <Info className="w-4 h-4 inline mr-2" />
            {infoMessage}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CourseSelector;