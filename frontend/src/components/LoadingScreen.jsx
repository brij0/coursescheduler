import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LoadingScreen = () => {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [progress, setProgress] = useState(0)

  const phrases = [
    "Your ideas are cooking...",
    "Crunching the latest data...",
    "Brewing some academic magic...",
    "Hang tight, greatness loading...",
    "Crafting your perfect schedule...",
    "Calculating academic excellence...",
    "Preparing your success story..."
  ]

  // Randomly select a phrase on component mount
  const [selectedPhrase] = useState(() => 
    phrases[Math.floor(Math.random() * phrases.length)]
  )

  useEffect(() => {
    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => {
      clearInterval(progressTimer)
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Elegant background pattern */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-primary-400/20 to-accent-400/20 blur-xl"
            style={{
              width: Math.random() * 150 + 100,
              height: Math.random() * 150 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Elegant loading spinner */}
        <div className="relative mb-12">
          <motion.div
            className="w-24 h-24 mx-auto relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 border-2 border-transparent border-t-accent-400/80 border-r-primary-400/60 rounded-full"></div>
            
            {/* Inner ring */}
            <motion.div
              className="absolute inset-3 border-2 border-transparent border-b-primary-400/80 border-l-accent-400/60 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Center logo */}
            <motion.div
              className="absolute inset-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                  "0 0 30px rgba(245, 158, 11, 0.5)",
                  "0 0 20px rgba(16, 185, 129, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                className="text-white text-lg font-bold font-display"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                SG
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Loading text */}
        <div className="mb-8">
          <motion.h2
            className="text-2xl md:text-3xl font-display font-semibold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {selectedPhrase}
          </motion.h2>
          
          <motion.p
            className="text-primary-200 text-lg"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Preparing your academic journey...
          </motion.p>
        </div>

        {/* Elegant progress bar */}
        <div className="w-80 max-w-sm mx-auto">
          <div className="bg-white/20 rounded-full h-1 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 via-accent-500 to-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <motion.p
            className="text-white/80 text-sm mt-3 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(progress)}% Complete
          </motion.p>
        </div>

        {/* Subtle academic elements */}
        <div className="absolute inset-0 pointer-events-none">
          {['📚', '🎓', '✨', '💡', '📊', '🌟'].map((emoji, i) => (
            <motion.div
              key={emoji}
              className="absolute text-2xl opacity-30"
              style={{
                left: `${20 + (i * 12)}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default LoadingScreen