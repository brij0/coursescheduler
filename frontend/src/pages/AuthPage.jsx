import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  GraduationCap
} from 'lucide-react'
import Navbar from '../components/Navbar'

const BACKEND_API_URL = 'http://127.0.0.1:8000';

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  // Get the redirect path from URL params or default to homepage
  const getRedirectPath = () => {
    const urlParams = new URLSearchParams(location.search)
    const from = urlParams.get('from')
    return from || '/'
  }
  // Clear messages when switching between login/register
  useEffect(() => {
    setMessage({ type: '', text: '' })
    setNeedsVerification(false)
  }, [isLogin])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  const validateEmail = (email) => {
    return email.endsWith('@uoguelph.ca')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isLogin) {
        // Login logic
        const response = await fetch(`${BACKEND_API_URL}/api/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        })

        const data = await response.json()

        if (response.ok) {
          setMessage({ 
            type: 'success', 
            text: `Welcome back, ${data.user.username}!` 
          })
          // Update navbar by triggering a re-check of auth status
          window.dispatchEvent(new Event('auth-change'))
          // Redirect to original page or homepage after successful login
          const redirectPath = getRedirectPath()
          setTimeout(() => {
            navigate(redirectPath, { replace: true })
          }, 1000)
        } else {
          setMessage({ 
            type: 'error', 
            text: data.error || 'Login failed. Please try again.' 
          })
        }
      } else {
        // Register logic
        if (!validateEmail(formData.email)) {
          setMessage({ 
            type: 'error', 
            text: 'Please use your @uoguelph.ca email address.' 
          })
          setIsLoading(false)
          return
        }

        const response = await fetch(`${BACKEND_API_URL}/api/auth/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        })

        const data = await response.json()

        if (response.ok) {
          setUserEmail(formData.email)
          setNeedsVerification(true)
          setMessage({ 
            type: 'success', 
            text: data.message 
          })
        } else {
          setMessage({ 
            type: 'error', 
            text: data.error || 'Registration failed. Please try again.' 
          })
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/resend-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userEmail
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Verification email resent successfully!' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to resend verification email.' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
      <Navbar />
      
      {/* Hero Section with Fireflies */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        {/* Fireflies Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main Fireflies */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: '#456882',
                boxShadow: `0 0 6px #456882, 0 0 12px #456882, 0 0 18px #456882`,
              }}
              initial={false}
              animate={{
                x: [
                  0,
                  Math.random() * 200 - 100,
                  Math.random() * 150 - 75,
                  Math.random() * 100 - 50,
                  0
                ],
                y: [
                  0,
                  Math.random() * 150 - 75,
                  Math.random() * 200 - 100,
                  Math.random() * 100 - 50,
                  0
                ],
                scale: [0, 1, 0.8, 1.2, 0.6, 1, 0],
                opacity: [0, 0.8, 0.3, 1, 0.4, 0.9, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                ease: "easeInOut", 
                delay: Math.random() * 5,
                repeatDelay: Math.random() * 3,
              }}
            />
          ))}
          
          {/* Smaller fireflies */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`small-${i}`}
              className="absolute w-0.5 h-0.5 rounded-full pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: '#456882',
                boxShadow: `0 0 4px #456882, 0 0 8px #456882`,
              }}
              initial={false}
              animate={{
                x: [
                  0,
                  Math.random() * 100 - 50,
                  Math.random() * 80 - 40,
                  0
                ],
                y: [
                  0,
                  Math.random() * 100 - 50,
                  Math.random() * 120 - 60,
                  0
                ],
                opacity: [0, 0.6, 0.2, 0.8, 0],
                scale: [0, 0.8, 1.2, 0.6, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 4,
                repeatDelay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Auth Content */}
        <div className="relative z-20 w-full max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center space-x-2 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#456882' }}>
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <Sparkles className="w-5 h-5" style={{ color: '#456882' }} />
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#456882' }}>
                {isLogin ? 'Welcome Back' : 'Join SmartGryph'}
              </h1>
              <p className="text-neutral-600">
                {isLogin 
                  ? 'Sign in to your account' 
                  : 'Create your account with @uoguelph.ca email'
                }
              </p>
            </div>

            {/* Verification Notice */}
            <AnimatePresence>
              {needsVerification && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-lg border border-blue-200"
                  style={{ backgroundColor: '#456882', color: 'white' }}
                >
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Check Your Email</h3>
                      <p className="text-sm opacity-90 mb-3">
                        We've sent a verification link to <strong>{userEmail}</strong>. 
                        Please check your email and click the link to activate your account.
                      </p>
                      <button
                        onClick={handleResendVerification}
                        disabled={isLoading}
                        className="text-sm underline hover:no-underline disabled:opacity-50"
                      >
                        Didn't receive it? Resend verification email
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Display */}
            <AnimatePresence>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth Form */}
            {!needsVerification && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#456882' }}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                {/* Email Field (Register only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      University Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': '#456882' }}
                        placeholder="your.name@uoguelph.ca"
                        required
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Must be a valid @uoguelph.ca email address
                    </p>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#456882' }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#456882' }}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Toggle Auth Mode */}
            {!needsVerification && (
              <div className="mt-8 text-center">
                <p className="text-neutral-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setFormData({ username: '', email: '', password: '' })
                    }}
                    className="ml-2 font-semibold hover:underline transition-colors"
                    style={{ color: '#456882' }}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AuthPage