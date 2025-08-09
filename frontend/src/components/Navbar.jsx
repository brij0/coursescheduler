import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Menu, X, LogOut, ChevronDown, MoreHorizontal, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMiscMenuOpen, setIsMiscMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoading, logout } = useAuth()

  const handleAuthNavigation = () => {
    // Pass current location as redirect parameter
    const currentPath = location.pathname
    const searchParams = location.search
    const fullPath = currentPath + searchParams
    navigate(`/auth?from=${encodeURIComponent(fullPath)}`)
  }

  const handleLogout = async () => {
    await logout()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const mainNavItems = [
    { name: 'Home', path: '/' },
    { name: 'GPA Calculator', path: '/gpa-calculator' },
    { name: 'Co-op Forum', path: '/coop-forum' },
    { name: 'Scheduler', path: '/scheduler' },
    { name: 'Dashboard', path: '/dashboard' },
  ]

  const miscNavItems = [
    { name: 'About', path: '/about' },
    { name: 'Privacy', path: '/privacy' },
  ]
  return (
    <div className="fixed top-6 left-0 right-0 z-40 flex justify-center px-4">
      <motion.nav
        className="w-full max-w-7xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Enhanced Glass Effect Container */}
        <div className="bg-white/30 backdrop-blur-lg border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] px-8 py-4 relative overflow-hidden">
          {/* Internal refraction effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-70 pointer-events-none"></div>
          <div className="absolute -inset-[1px] bg-gradient-to-br from-white/50 to-white/5 pointer-events-none rounded-full"></div>
          
          {/* Content */}
          <div className="relative z-10 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: '#456882' }}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 0 20px rgba(69, 104, 130, 0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-500 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10"
                  >
                    <GraduationCap className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.div>
                <span className="font-display font-bold text-2xl text-neutral-800">
                  SmartGryph
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-full ${
                    location.pathname === item.path
                      ? 'text-white bg-primary-500 shadow-lg'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/30'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* More Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsMiscMenuOpen(!isMiscMenuOpen)}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full flex items-center space-x-1 ${
                    miscNavItems.some(item => location.pathname === item.path)
                      ? 'text-white bg-primary-500 shadow-lg'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/30'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MoreHorizontal size={16} />
                  <span>More</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isMiscMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* User Authentication Section */}
            <div className="hidden md:flex">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              ) : user ? (
                // Logged in - Show user dropdown
                <div className="relative">
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-full font-medium hover:bg-primary-600 transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User size={16} />
                    <span>{user.username}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl py-2"
                        style={{ zIndex: 9999 }}
                      >
                        <div className="px-4 py-2 border-b border-neutral-200/50">
                          <p className="text-sm font-medium text-neutral-800">{user.username}</p>
                          <p className="text-xs text-neutral-600">{user.email}</p>
                        </div>
                        
                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                          whileHover={{ x: 4 }}
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Not logged in - Show login button
                <motion.button
                  className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-full font-medium hover:bg-primary-600 transition-all duration-300 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAuthNavigation}
                >
                  <User size={16} />
                  <span>Login</span>
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full text-neutral-700 hover:bg-white/30 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              className="md:hidden mt-4 pt-4 border-t border-white/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-2">
                {[...mainNavItems, ...miscNavItems].map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'text-white bg-primary-500 shadow-lg'
                        : 'text-neutral-700 hover:text-primary-600 hover:bg-white/30'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Auth Section */}
                {isLoading ? (
                  <div className="flex justify-center py-2">
                    <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : user ? (
                  <div className="pt-2 border-t border-white/20">
                    <div className="px-4 py-2 text-sm">
                      <p className="font-medium text-neutral-800">{user.username}</p>
                      <p className="text-xs text-neutral-600">{user.email}</p>
                    </div>
                    <motion.button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full font-medium mt-2 shadow-lg"
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    className="flex items-center justify-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-full font-medium mt-2 shadow-lg"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleAuthNavigation()
                    }}
                  >
                    <User size={16} />
                    <span>Login</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>
      
      {/* Click outside handler remains the same */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 9998 }}
          onClick={() => {
            setIsUserMenuOpen(false)
          }}
        />
      )}
      
      {/* Separate portal for More dropdown to ensure it's above everything */}
      <AnimatePresence>
        {isMiscMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 99998 }}
              onClick={() => setIsMiscMenuOpen(false)}
            />
            
            {/* Dropdown positioned absolutely on the page */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bg-white/95 backdrop-blur-lg border border-white/40 rounded-xl shadow-2xl py-2 w-48"
              style={{ 
                top: '80px',
                right: '2rem',
                zIndex: 99999,
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)"
              }}
            >
              {miscNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary-600 bg-primary-50/50'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/50'
                  }`}
                  onClick={() => setIsMiscMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Navbar