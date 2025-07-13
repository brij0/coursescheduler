import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LoadingScreen = () => {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [progress, setProgress] = useState(0)

  const phrases = [
    "Your ideas are cooking...",
    "Crunching the latest data...",
    "Brewing some academic magic...",
    "Hang tight, greatness loading..."
  ]

  useEffect(() => {
    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 1.5
      })
    }, 25)

    // Phrase rotation
    const phraseTimer = setInterval(() => {
      setCurrentPhrase(prev => (prev + 1) % phrases.length)
    }, 600)

    return () => {
      clearInterval(progressTimer)
      clearInterval(phraseTimer)
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Code-like particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`code-${i}`}
            className="absolute text-green-400/30 font-mono text-xs"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {['</>','{}','[]','()','&&','||','=='][Math.floor(Math.random() * 7)]}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Main loading spinner */}
        <div className="relative mb-8">
          <motion.div
            className="w-32 h-32 mx-auto relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-white/80 border-r-blue-400/60 rounded-full"></div>
            
            {/* Middle ring */}
            <motion.div
              className="absolute inset-4 border-4 border-transparent border-b-purple-400/80 border-l-pink-400/60 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner core */}
            <motion.div
              className="absolute inset-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 40px rgba(147, 51, 234, 0.8)",
                  "0 0 20px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="text-white text-2xl font-bold"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                SG
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Loading text */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentPhrase}
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {phrases[currentPhrase]}
            </motion.h2>
          </AnimatePresence>
          
          <motion.p
            className="text-blue-200 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Preparing your academic journey...
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="w-80 max-w-sm mx-auto">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <motion.p
            className="text-white/80 text-sm mt-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {Math.round(progress)}% Complete
          </motion.p>
        </div>

        {/* Fun academic icons floating around */}
        <div className="absolute inset-0 pointer-events-none">
          {['🎓', '📚', '✏️', '🧮', '📊', '💡'].map((emoji, i) => (
            <motion.div
              key={emoji}
              className="absolute text-4xl"
              style={{
                left: `${15 + (i * 15)}%`,
                top: `${20 + (i % 2) * 60}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.5,
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