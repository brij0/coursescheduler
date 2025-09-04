import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'

const VerificationSuccessPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email || ''
  const [countdown, setCountdown] = useState(7)

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, navigate])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F9FF' }}>
      <Helmet>
        <title>Email Verified | ugflow</title>
        <meta name="description" content="Your email has been verified. Welcome to ugflow." />
      </Helmet>

      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center pt-24 px-4">
        <motion.div
          className="relative z-20 w-full max-w-2xl mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-36 h-36 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#45688220,#5a94b020)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <CheckCircle className="w-20 h-20 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-display font-extrabold text-neutral-800 mb-3">
            Email Verified.
          </h1>

          <p className="text-neutral-600 mb-6">
            {email ? (
              <>Great — <strong>{email}</strong> is now verified. Your account is active.</>
            ) : (
              <>Your email has been verified. You can now sign in and continue.</>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => navigate('/auth')}
              whileHover={{ y: -2 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-primary-500 text-white font-semibold shadow-md"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.button>

            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ y: -2 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-neutral-200 text-primary-600 font-semibold shadow-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              <span>Back to Home</span>
            </motion.button>
          </div>

          <p className="text-xs text-neutral-400 mt-6">
            Redirecting to homepage in <strong>{countdown}s</strong>. If you have any trouble signing in, contact us at <strong>uofgflow@gmail.com</strong>.
          </p>
        </motion.div>
      </section>
    </div>
  )
}

export default VerificationSuccessPage