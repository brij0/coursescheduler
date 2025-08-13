import React from 'react';
import { motion } from 'framer-motion';

const TermSelector = ({ 
  selectedTerm, 
  setSelectedTerm, 
  offeredTerms, 
  title = "Select Term",
  subtitle = null,
  disabled = false 
}) => {
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/30"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#456882' }}>
        {title}
      </h2>
      
      {subtitle && (
        <p className="text-neutral-600 mb-4">{subtitle}</p>
      )}
      
      <select
        value={selectedTerm}
        onChange={(e) => setSelectedTerm(e.target.value)}
        disabled={disabled}
        className="w-full md:w-auto px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
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
  );
};

export default TermSelector;