import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Menu, X } from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleAuthNavigation = () => {
    // Pass current location as redirect parameter
    const currentPath = location.pathname
    navigate(`/auth?from=${encodeURIComponent(currentPath)}`)
  }
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'GPA Calculator', path: '/gpa-calculator' },
    { name: 'About', path: '/about' },
    { name: 'Privacy', path: '/privacy' },
  ]

  return (
    <div className="fixed top-6 left-0 right-0 z-40 flex justify-center px-4">
      <motion.nav
        className="w-full max-w-4xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full shadow-2xl px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display font-bold text-xl gradient-text">
                SmartGryph
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                    location.pathname === item.path
                      ? 'text-white bg-primary-500 shadow-lg'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/30'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Login Button */}
            <div className="hidden md:flex">
              <motion.button
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-full font-medium hover:bg-primary-600 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAuthNavigation}
              >
                <User size={16} />
                <span>Login</span>
              </motion.button>
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
                {navItems.map((item) => (
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
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}

export default Navbar