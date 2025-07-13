import React from 'react'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Center } from '@react-three/drei'
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Coffee, 
  Code, 
  Lightbulb,
  Heart,
  MessageCircle,
  Send
} from 'lucide-react'
import Navbar from '../components/Navbar'

// 3D Developer Scene
const DeveloperScene = () => {
  return (
    <group>
      {/* Floating Code Blocks */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[-2, 1, 0]} rotation={[0.2, 0.3, 0.1]}>
          <boxGeometry args={[0.4, 0.3, 0.1]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </Float>
      
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.7}>
        <mesh position={[2, -0.5, -1]} rotation={[-0.1, -0.4, 0.2]}>
          <boxGeometry args={[0.3, 0.4, 0.08]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      </Float>

      {/* Laptop */}
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[0, 0, 0]} rotation={[0, 0.3, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.8]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh position={[0, 0.3, -0.35]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[1.2, 0.8, 0.05]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      </Float>

      {/* Coffee Cup */}
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.6}>
        <group position={[1.5, 0.5, 1]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
            <torusGeometry args={[0.08, 0.02, 8, 16]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </group>
      </Float>

      {/* Lightbulb */}
      <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[-1.5, -1, 1]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      </Float>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
    </group>
  )
}

const AboutPage = () => {
  const developers = [
    {
      name: "Brijesh Thakrar",
      role: "Frontend Developer & UI/UX Designer",
      description: "The one who makes things look pretty and actually work. Obsessed with user experience and probably has strong opinions about button colors.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"],
      github: "https://github.com/brij0",
      linkedin: "https://linkedin.com/in/brijesh-thakrar",
      portfolio: "https://brijesh-portfolio.dev",
      avatar: "🎨",
      funFact: "Can debug CSS for hours but still can't center a div on the first try"
    },
    {
      name: "Your Backend Wizard",
      role: "Backend Developer & System Architect",
      description: "The mastermind behind the scenes. Builds APIs that actually work and databases that don't crash at 3 AM.",
      skills: ["Django", "Python", "PostgreSQL", "REST APIs", "System Design"],
      github: "https://github.com/backend-wizard",
      linkedin: "https://linkedin.com/in/backend-wizard",
      portfolio: "https://backend-wizard.dev",
      avatar: "⚡",
      funFact: "Speaks fluent SQL and dreams in JSON"
    }
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <DeveloperScene />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
          </Canvas>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-green-900/10 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6">
              <span className="gradient-text">About</span>
              <span className="text-gray-800"> SmartGryph</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Born from late-night study sessions and too much caffeine. 
              Built by students, for students who refuse to settle for mediocre tools.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-gray-800">
              How It All Started
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-accent-500 mx-auto mb-8"></div>
          </motion.div>

          <motion.div
            className="prose prose-lg mx-auto text-gray-600"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl">
              <p className="text-lg leading-relaxed mb-6">
                Picture this: It's 2 AM, you're trying to figure out if MATH*1200 conflicts with CIS*2750, 
                your GPA calculator is giving you existential dread, and the co-op portal looks like it was 
                designed in 1995. Sound familiar?
              </p>
              
              <p className="text-lg leading-relaxed mb-6">
                That's exactly where we were. Two Computer Science students at the University of Guelph, 
                drowning in spreadsheets and frustrated with clunky university systems. We thought, 
                "There has to be a better way."
              </p>
              
              <p className="text-lg leading-relaxed">
                So we built one. SmartGryph isn't just another student portal – it's the tool we wish we had 
                from day one. Clean, intuitive, and actually helpful. Because your academic life is complicated 
                enough without fighting with bad software.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-gray-800">
              Meet the <span className="gradient-text">Dream Team</span>
            </h2>
            <p className="text-xl text-gray-600">
              Two developers, countless energy drinks, and one shared mission: 
              making student life less painful.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{dev.avatar}</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{dev.name}</h3>
                  <p className="text-primary-600 font-semibold">{dev.role}</p>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {dev.description}
                </p>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Tech Stack:</h4>
                  <div className="flex flex-wrap gap-2">
                    {dev.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="text-sm text-gray-500 italic mb-4">
                    "{dev.funFact}"
                  </p>
                  
                  <div className="flex space-x-4">
                    <motion.a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Github size={20} />
                      <span>GitHub</span>
                    </motion.a>
                    
                    <motion.a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Linkedin size={20} />
                      <span>LinkedIn</span>
                    </motion.a>
                    
                    <motion.a
                      href={dev.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink size={20} />
                      <span>Portfolio</span>
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-gray-800">
              Let's <span className="gradient-text">Connect</span>
            </h2>
            <p className="text-xl text-gray-600">
              Got feedback? Found a bug? Just want to say hi? We'd love to hear from you!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Get in Touch</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-gray-600">hello@smartgryph.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Response Time</p>
                    <p className="text-gray-600">Usually within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">We Love</p>
                    <p className="text-gray-600">Feature requests & bug reports</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Your awesome name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>
                
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send size={20} />
                  <span>Send Message</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage