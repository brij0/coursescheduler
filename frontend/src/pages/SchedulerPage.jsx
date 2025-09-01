import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Grid } from 'lucide-react';
import Navbar from '../components/Navbar';

const SchedulerPage = () => {
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
            <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
              Course Scheduler Tools
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Choose the tool that fits your needs: build conflict-free schedules or export course events to your calendar.
            </p>
          </motion.div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Conflict-Free Schedule Builder */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30 hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#456882' }}>
                  <Grid className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#456882' }}>
                  Conflict-Free Schedule
                </h2>
              </div>
              <p className="text-neutral-600 mb-6">
                Generate conflict-free course schedules based on your selected courses.
              </p>
              <Link
                to="/conflict-free-schedule"
                className="inline-block px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: '#456882' }}
              >
                Go to Schedule Builder
              </Link>
            </motion.div>

            {/* Course Assignment Calendar */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30 hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#456882' }}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#456882' }}>
                  Course Assignment Calendar
                </h2>
              </div>
              <p className="text-neutral-600 mb-6">
                Export your course events to import into your favorite calendar app.
              </p>
              <Link
                to="/schedule"
                className="inline-block px-6 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: '#456882' }}
              >
                Go to Assignment Calendar
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchedulerPage;