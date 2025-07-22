import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Mail, ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'

const EmailVerificationPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error', 'expired'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}/`, {
          method: 'GET',
          credentials: 'include'
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth')
          }, 3000)
        } else {
          if (data.error.includes('expired')) {
            setStatus('expired')
          } else {
            setStatus('error')
          }
          setMessage(data.error)
        }
      } catch (error) {
        setStatus('error')
        setMessage('Network error. Please try again later.')
      }
    }

    if (token) {
      verifyEmail()
    } else {
      setStatus('error')
      setMessage('Invalid verification link.')
    }
  }, [token, navigate])

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'error':
      case 'expired':
        return <AlertCircle className="w-16 h-16 text-red-500" />
      default:
        return (
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: '#456882', borderTopColor: 'transparent' }} />
        )
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Link Expired'
      default:
        return 'Verifying Your Email...'
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
      <Navbar />
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        {/* Fireflies Animation */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full shadow-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: '#456882',
                boxShadow: `0 0 6px #456882, 0 0 12px #456882`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                scale: [0, 1, 0.5, 1, 0],
                opacity: [0, 0.8, 0.3, 0.9, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        {/* Verification Content */}
        <div className="relative z-20 w-full max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/30 text-center"
          >
            {/* Header */}
            <div className="mb-8">
              <motion.div
                className="inline-flex items-center space-x-2 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles className="w-5 h-5" style={{ color: '#456882' }} />
                <span className="font-bold text-xl" style={{ color: '#456882' }}>SmartGryph</span>
                <Sparkles className="w-5 h-5" style={{ color: '#456882' }} />
              </motion.div>
            </div>

            {/* Status Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {getStatusIcon()}
            </motion.div>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
                {getStatusTitle()}
              </h1>
              
              <p className="text-neutral-600 mb-6 leading-relaxed">
                {message}
              </p>

              {/* Action Buttons */}
              {status === 'success' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
                    Redirecting to login page in 3 seconds...
                  </p>
                  <motion.button
                    onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: '#456882' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}

              {(status === 'error' || status === 'expired') && (
                <div className="space-y-4">
                  <motion.button
                    onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: '#456882' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Back to Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  
                  {status === 'expired' && (
                    <p className="text-sm text-neutral-500">
                      You can request a new verification email from the registration page.
                    </p>
                  )}
                </div>
              )}

              {status === 'verifying' && (
                <p className="text-sm text-neutral-500">
                  Please wait while we verify your email address...
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default EmailVerificationPage