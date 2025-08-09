import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  Users, 
  Zap, 
  Target,
  ChevronDown,
  Star,
  Coffee,
  Brain,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const HomePage = () => {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const handleStartJourney = () => {
    navigate('/auth')
  }

  // Animated text component for the highlight effect
  const AnimatedHighlight = ({ children, delay = 0 }) => {
    return (
      <motion.span
        className="relative inline-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
      >
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-primary-200/60 to-accent-200/60 rounded-lg -skew-x-12"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.3, ease: "easeOut" }}
        />
        <span className="relative z-10 px-2 font-bold text-primary-800">
          {children}
        </span>
      </motion.span>
    )
  }

  // Typewriter effect component
  const TypewriterText = ({ text, delay = 0 }) => {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay }}
      >
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.05, 
              delay: delay + (index * 0.03),
              ease: "easeOut"
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    )
  }
  const features = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Course Scheduling",
      description: "Never double-book again! Our AI finds the perfect schedule that fits your life.",
      color: "from-primary-500 to-primary-600"
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "GPA Calculator",
      description: "Track your grades and predict your GPA with scary accuracy. No more surprises!",
      color: "from-accent-500 to-accent-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Co-op Forum",
      description: "Share job experiences, tips, and survive the co-op hunt together.",
      color: "from-primary-600 to-accent-500"
    }
  ]

  const funFacts = [
    { icon: <Coffee />, text: "Powered by 47% coffee, 53% determination" },
    { icon: <Brain />, text: "Built by students who've been there, done that" },
    { icon: <Star />, text: "Tested by procrastinators, approved by perfectionists" }
  ]

  return (
    <div ref={containerRef} className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
        style={{ y, opacity }}
      >
        {/* Fireflies Animation */}
        <div className="absolute inset-0">
          {/* Fireflies */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-500 rounded-full shadow-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 6px #456882, 0 0 12px #456882, 0 0 18px #456882`,
              }}
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
          
          {/* Additional smaller fireflies */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`small-${i}`}
              className="absolute w-0.5 h-0.5 bg-primary-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 4px #456882, 0 0 8px #456882`,
              }}
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

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">Your Academic Success Starts Here</span>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl font-display font-black mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.span 
                className="text-primary-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                Smart
              </motion.span>
              <motion.span 
                className="text-neutral-800"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                Gryph
              </motion.span>
            </motion.h1>
            
            <div className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <TypewriterText 
                  text="Your academic life just got an upgrade. Schedule courses, calculate GPAs, and navigate co-op like a pro. "
                  delay={1.6}
                />
                <AnimatedHighlight delay={3.5}>
                  Because adulting is hard enough.
                </AnimatedHighlight>
              </motion.p>
            </div>

            <motion.div
              className="flex justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 4.2 }}
            >
              <motion.button
                onClick={handleStartJourney}
                className="bg-primary-500 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:bg-primary-600 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Start Your Journey</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-neutral-400" />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-neutral-800">
              Why Students <span className="text-primary-600">Love Us</span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We've been in your shoes. Late nights, scheduling conflicts, GPA anxiety. 
              That's why we built tools that actually work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl elegant-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <motion.div 
                  className="inline-flex p-4 rounded-xl bg-primary-500 text-white mb-6 transition-transform duration-300 shadow-lg"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    boxShadow: "0 10px 25px rgba(69, 104, 130, 0.3)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-4 text-neutral-800 font-display">
                  {feature.title}
                </h3>
                
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fun Facts Section */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mb-12 text-neutral-800"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            The Real Talk
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {funFacts.map((fact, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 elegant-card rounded-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
              >
                <motion.div 
                  className="text-primary-600 mb-4"
                  whileHover={{ 
                    scale: 1.2,
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {React.cloneElement(fact.icon, { size: 48 })}
                </motion.div>
                <p className="text-neutral-700 font-medium text-center">
                  {fact.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Level Up?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who've already discovered the secret to academic success. 
              Spoiler alert: it's not more coffee.
            </p>
            
            <motion.button
              onClick={handleStartJourney}
              className="bg-white text-primary-700 px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-200/30 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Get Started Free</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage