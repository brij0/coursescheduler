import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarPlus, CalendarX } from 'lucide-react';
import api from '../config/api';

export default function Events({ events }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const hasEvents = events && Object.keys(events).length > 0;

  const handleAddToCalendar = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/add_to_calendar/', events);
      setMessage('Events added to your Google Calendar successfully!');
    } catch (err) {
      console.error('Failed to add to calendar:', err);
      if (err.response?.status === 401) {
        setError('Please log in with Google to add events to your calendar.');
      } else {
        setError(err.response?.data?.error || 'Failed to add events to calendar. Please try again.');
      }
    } finally {
      setLoading(false);
    }

    // Clear messages after 5 seconds
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 5000);
  };

  return (
    <div className="space-y-8">
      <motion.div
        className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 mb-8 rounded-b-[20px] text-center shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {hasEvents ? (
          <>
            <h1 className="text-4xl font-bold mb-2">Your Course Schedule</h1>
            <p className="text-lg">Here&apos;s your personalized course schedule</p>
          </>
        ) : (
          <>
            <CalendarX className="mx-auto mb-4 text-6xl text-gray-300" />
            <h1 className="text-3xl font-semibold mb-2">No Events Found</h1>
            <p className="text-gray-300">Please select at least one course to view the schedule.</p>
          </>
        )}
      </motion.div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {hasEvents &&
        Object.entries(events).map(([course, slots]) => (
          <motion.div
            key={course}
            className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-blue-600 px-4 py-3 text-white font-semibold text-xl">
              {course}
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Event Type','Event Date','Days','Time','Location','Description','Weightage'].map(header => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-gray-600 text-sm font-medium uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {slots.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium">{e.event_type}</td>
                      <td className="px-4 py-3 text-gray-700">{e.event_date || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{e.days || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{e.time || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{e.location || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{e.description || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{e.weightage || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}

      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Search Another Course</span>
        </Button>

        {hasEvents && (
          <Button
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddToCalendar}
            disabled={loading}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{loading ? 'Adding...' : 'Add to Google Calendar'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}