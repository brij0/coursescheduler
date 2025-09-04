import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Map, Home, Search, ArrowLeft, Compass } from 'lucide-react';
import Navbar from '../components/Navbar';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F9FF' }}>
      <Helmet>
        <title>Page Not Found | ugflow</title>
        <meta name="description" content="Sorry, the page you're looking for cannot be found." />
      </Helmet>
      
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        {/* Background grid */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full z-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#90a1ae" strokeWidth="0.3" opacity="0.15" />
              </pattern>
              <pattern id="grid-pattern-bold" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M 150 0 L 0 0 0 150" fill="none" stroke="#90a1ae" strokeWidth="0.7" opacity="0.25" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" />
            <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern-bold)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-20 px-4 max-w-4xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Error Code */}
            <motion.h1 
              className="text-[150px] md:text-[200px] font-display font-black leading-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-primary-600">4</span>
              <motion.span 
                className="text-primary-400"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: 'loop', 
                  ease: "easeInOut"
                }}
                style={{ display: 'inline-block' }}
              >0</motion.span>
              <span className="text-primary-600">4</span>
            </motion.h1>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-neutral-800">
                Oops! We've lost our <span className="text-primary-500">coordinates.</span>
              </h2>
              
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Even with all our academic algorithms, we couldn't calculate a route to this page.
                Looks like we need to study our own map a bit more!
              </p>

              {/* Navigation Options */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link to="/" className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-full font-medium shadow-lg hover:bg-primary-700 transition-colors">
                    <Home size={20} className="mr-2" />
                    <span>Back to Home</span>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link to="/about" className="flex items-center px-6 py-3 bg-white text-primary-600 border border-primary-200 rounded-full font-medium shadow-md hover:bg-primary-50 transition-colors">
                    <Compass size={20} className="mr-2" />
                    <span>Explore About Us</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Map Element */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center mb-4">
                <Map className="w-6 h-6 mr-3" style={{ color: '#456882' }} />
                <h3 className="text-xl font-bold" style={{ color: '#456882' }}>
                  Popular Destinations
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Link to="/gpa-calculator" className="p-4 rounded-lg hover:bg-primary-50 transition-colors flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#456882' }}>
                    <span className="text-white font-bold">GPA</span>
                  </div>
                  <span className="font-medium text-neutral-800">GPA Calculator</span>
                </Link>
                
                <Link to="/conflict-free-schedule" className="p-4 rounded-lg hover:bg-primary-50 transition-colors flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#456882' }}>
                    <span className="text-white font-bold">CS</span>
                  </div>
                  <span className="font-medium text-neutral-800">Course Scheduler</span>
                </Link>
                
                <Link to="/assignment-calendar" className="p-4 rounded-lg hover:bg-primary-50 transition-colors flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#456882' }}>
                    <span className="text-white font-bold">AC</span>
                  </div>
                  <span className="font-medium text-neutral-800">Assignment Calendar</span>
                </Link>
              </div>
              
              <div className="text-center mt-6 text-sm text-neutral-500">
                <p>"Not all who wander are lost, but this page definitely is."</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;