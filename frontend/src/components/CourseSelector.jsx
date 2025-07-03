import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import api from '../config/api';

export default function CourseSelector({ onResults }) {
  const [type, setType] = useState('');
  const [code, setCode] = useState('');
  const [section, setSection] = useState('');
  const [courseTypes, setCourseTypes] = useState([]);
  const [courseCodes, setCourseCodes] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available course types on mount
  useEffect(() => {
    setLoading(true);
    api.get('/api/course_types/')
      .then(res => {
        setCourseTypes(res.data);
      })
      .catch(err => {
        console.error('Failed to load course types:', err);
        setError('Failed to load course types');
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch codes when a type is selected
  useEffect(() => {
    if (!type) {
      setCourseCodes([]);
      setCode('');
      setSections([]);
      setSection('');
      return;
    }
    
    setLoading(true);
    api.post('/api/get_course_codes/', { course_type: type })
      .then(res => {
        setCourseCodes(res.data);
        setCode(''); // Reset code selection
        setSections([]); // Reset sections
        setSection(''); // Reset section selection
      })
      .catch(err => {
        console.error('Failed to load course codes:', err);
        setError('Failed to load course codes');
      })
      .finally(() => setLoading(false));
  }, [type]);

  // Fetch section numbers when a code is selected
  useEffect(() => {
    if (!type || !code) {
      setSections([]);
      setSection('');
      return;
    }
    
    setLoading(true);
    api.post('/api/get_section_numbers/', { 
      course_type: type, 
      course_code: code 
    })
      .then(res => {
        setSections(res.data);
        setSection(''); // Reset section selection
      })
      .catch(err => {
        console.error('Failed to load sections:', err);
        setError('Failed to load sections');
      })
      .finally(() => setLoading(false));
  }, [type, code]);

  // Reset dependent fields when parent fields change
  const handleTypeChange = (e) => {
    setType(e.target.value);
    setCode('');
    setSection('');
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    setSection('');
  };

  // Perform search
  const search = () => {
    if (!type || !code || !section) {
      setError('Please select all fields');
      return;
    }

    setError(null);
    setLoading(true);
    
    // Use FormData to match Django's expected format
    const formData = new FormData();
    formData.append('course_type_0', type);
    formData.append('course_code_0', code);
    formData.append('section_number_0', section);

    api.post('/api/search/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
      .then(res => {
        // Pass the events data to parent component
        onResults(res.data.events || res.data);
        console.log('Search results:', res.data.events || res.data);
      })
      .catch(err => {
        console.error('Search failed:', err);
        setError('Search failed. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <select
          value={type}
          onChange={handleTypeChange}
          disabled={loading}
          className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select Type</option>
          {courseTypes.map(ct => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>

        <select
          value={code}
          onChange={handleCodeChange}
          disabled={loading || !type || courseCodes.length === 0}
          className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select Code</option>
          {courseCodes.map(cc => (
            <option key={cc} value={cc}>{cc}</option>
          ))}
        </select>

        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          disabled={loading || !code || sections.length === 0}
          className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select Section</option>
          {sections.map(sn => (
            <option key={sn} value={sn}>{sn}</option>
          ))}
        </select>

        <Button
          onClick={search}
          disabled={loading || !type || !code || !section}
          className="h-12 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 hover:translate-y-[-1px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Search'}
        </Button>
      </motion.div>
    </div>
  );
}