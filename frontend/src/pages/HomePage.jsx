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
import Navbar from '../components/Navbar'

const HomePage = () => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

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
        {/* Elegant background elements */}
        <div className="absolute inset-0">
          {/* Floating geometric shapes */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              <div className={`w-${Math.floor(Math.random() * 4) + 2} h-${Math.floor(Math.random() * 4) + 2} bg-primary-200/30 rounded-full blur-sm`} />
            </motion.div>
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

            <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
              <span className="text-primary-600">Smart</span>
              <span className="text-neutral-800">Gryph</span>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Your academic life just got an upgrade. Schedule courses, calculate GPAs, 
              and navigate co-op like a pro. <span className="font-semibold text-primary-700">Because adulting is hard enough.</span>
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:bg-primary-600 hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Journey
              </motion.button>
              
              <motion.button
                className="border-2 border-primary-300 text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-primary-500 hover:text-primary-800 hover:bg-primary-50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Demo
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
              >
                <div className="inline-flex p-4 rounded-xl bg-primary-500 text-white mb-6 transition-transform duration-300 shadow-lg">
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-neutral-800 font-display">
                  {feature.title}
                </h3>
                
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
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
              >
                <div className="text-primary-600 mb-4">
                  {React.cloneElement(fact.icon, { size: 48 })}
                </div>
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
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage