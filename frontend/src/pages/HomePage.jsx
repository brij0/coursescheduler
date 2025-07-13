import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Center } from '@react-three/drei'
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
  Brain
} from 'lucide-react'
import Navbar from '../components/Navbar'

// 3D Academic Scene Component
const AcademicScene = () => {
  return (
    <group>
      {/* Floating Books */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-2, 1, 0]} rotation={[0.2, 0.3, 0.1]}>
          <boxGeometry args={[0.3, 0.4, 0.05]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      </Float>
      
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.7}>
        <mesh position={[2, -0.5, -1]} rotation={[-0.1, -0.4, 0.2]}>
          <boxGeometry args={[0.25, 0.35, 0.04]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
      </Float>

      {/* Graduation Cap */}
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[0, 2, -2]}>
          <mesh>
            <cylinderGeometry args={[0.8, 0.8, 0.1, 8]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[1.6, 0.05, 1.6]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      </Float>

      {/* Calculator */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[1.5, 0.5, 1]} rotation={[0.1, -0.2, 0]}>
          <boxGeometry args={[0.4, 0.6, 0.08]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </Float>

      {/* Pencils */}
      <Float speed={1.3} rotationIntensity={0.6} floatIntensity={0.5}>
        <mesh position={[-1.5, -1, 1]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </Float>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
    </group>
  )
}

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
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "GPA Calculator",
      description: "Track your grades and predict your GPA with scary accuracy. No more surprises!",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Co-op Forum",
      description: "Share job experiences, tips, and survive the co-op hunt together.",
      color: "from-green-500 to-emerald-500"
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
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ y, opacity }}
      >
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <AcademicScene />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          </Canvas>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
              <span className="gradient-text">Smart</span>
              <span className="text-gray-800">Gryph</span>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Your academic life just got an upgrade. Schedule courses, calculate GPAs, 
              and navigate co-op like a pro. <span className="font-semibold text-primary-600">Because adulting is hard enough.</span>
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                className="bg-gradient-to-r from-primary-600 to-accent-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Journey
              </motion.button>
              
              <motion.button
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-primary-500 hover:text-primary-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Demo
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </div>
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
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Why Students <span className="gradient-text">Love Us</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've been in your shoes. Late nights, scheduling conflicts, GPA anxiety. 
              That's why we built tools that actually work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fun Facts Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mb-12 text-gray-800"
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
                className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-primary-600 mb-4">
                  {React.cloneElement(fact.icon, { size: 48 })}
                </div>
                <p className="text-gray-700 font-medium text-center">
                  {fact.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-accent-600">
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
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who've already discovered the secret to academic success. 
              Spoiler alert: it's not more coffee.
            </p>
            
            <motion.button
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
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