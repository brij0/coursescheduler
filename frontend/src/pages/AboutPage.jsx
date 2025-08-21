import React from "react";
import { motion } from "framer-motion";
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
  Send,
  Sparkles,
  Database,
  Calendar,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Users,
  Eye,
  Clock,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";

const AboutPage = () => {
  const developers = [
    {
      name: "Mann Modi",
      role: "Frontend Developer & UI/UX Designer",
      description:
        "The creative force responsible for the application's user interface and experience. Mann focuses on making the platform intuitive, accessible, and visually appealing.",
      skills: [
        "React",
        "JavaScript",
        "Tailwind CSS",
        "Framer Motion",
        "Three.js",
        "Vite",
      ],
      github: "https://github.com/mann-uofg",
      linkedin: "https://www.linkedin.com/in/mann-uofg/",
      portfolio: "https://mann-portfolio-site.vercel.app/",
      avatar: "/images/frontend-dev.jpeg",
      funFact:
        "Believes the perfect shade of blue (#F3F9FF) can solve at least 50% of user retention problems.",
    },
    {
      name: "Brijesh Thakrar",
      role: "Backend Developer & System Architect",
      description:
        "The architect behind the server-side logic, system design, APIs, and database management. Brijesh ensures the system is robust, scalable, and performs efficiently under load.",
      skills: [
        "System Design",
        "Django",
        "Python",
        "PostgreSQL",
        "Docker",
        "Redis",
        "Celery",
      ],
      github: "https://github.com/brij0",
      linkedin: "https://www.linkedin.com/in/brijeshthakrar/",
      portfolio: "https://backend-wizard.dev",
      avatar: "/images/backend-dev.jpeg",
      funFact:
        "Finds a strange sense of calm in optimizing database queries (flags over table joins) and containerizing services.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 bg-neutral-50">
        {/* Elegant background elements */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, Math.random() * 15 - 7.5, 0],
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              <div
                className={`w-${Math.floor(Math.random() * 3) + 2} h-${
                  Math.floor(Math.random() * 3) + 2
                } bg-primary-200/40 rounded-full blur-sm`}
              />
            </motion.div>
          ))}
        </div>

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
                  0,
                ],
                y: [
                  0,
                  Math.random() * 150 - 75,
                  Math.random() * 200 - 100,
                  Math.random() * 100 - 50,
                  0,
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
                x: [0, Math.random() * 100 - 50, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * 100 - 50, Math.random() * 120 - 60, 0],
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
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">
                From Pain Points to Solutions
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-display font-black mb-6">
              <span className="text-primary-600">About</span>
              <span className="text-neutral-800"> ugflow</span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed">
              Born from missed deadlines, Excel nightmares, and too much
              caffeine. Built by students who learned the hard way that there
              had to be a better solution.
              <span className="block mt-2 font-semibold text-primary-700">
                100% open source for complete transparency and community-driven
                development.
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-neutral-800">
              Meet the <span className="text-primary-600">Team</span>
            </h2>
            <p className="text-xl text-neutral-600">
              Two developers, countless coding hours, and one shared mission:
              making student life less painful.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                className="elegant-card rounded-2xl p-8 flex flex-col"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-6">
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover shadow-lg"
                  />
                  <h3 className="text-2xl font-bold text-neutral-800 mb-2 font-display">
                    {dev.name}
                  </h3>
                  <p className="text-primary-600 font-semibold">{dev.role}</p>
                </div>

                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {dev.description}
                </p>

                <div className="mb-6">
                  <h4 className="font-semibold text-neutral-800 mb-3">
                    Skills:
                  </h4>
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

                <div className="mt-auto">
                  <div className="border-t border-neutral-200 pt-6">
                    <p className="text-sm text-neutral-500 italic mb-4">
                      "{dev.funFact}"
                    </p>

                    <div className="flex space-x-4">
                      <motion.a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 transition-colors"
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
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors"
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
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink size={20} />
                        <span>Portfolio</span>
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-neutral-800">
              Built with <span className="text-primary-600">Modern Tech</span>
            </h2>
            <p className="text-xl text-neutral-600">
              We use cutting-edge technologies to deliver a fast, reliable, and
              beautiful experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Frontend Stack */}
            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 font-display">
                  Frontend
                </h3>
              </div>

              <p className="text-neutral-600 mb-6 leading-relaxed">
                Modern React application with smooth animations, responsive
                design, and intuitive user experience.
              </p>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "React 18", color: "bg-blue-100 text-blue-700" },
                    { name: "Vite", color: "bg-purple-100 text-purple-700" },
                    {
                      name: "Tailwind CSS",
                      color: "bg-cyan-100 text-cyan-700",
                    },
                    {
                      name: "Framer Motion",
                      color: "bg-pink-100 text-pink-700",
                    },
                  ].map((tech, index) => (
                    <motion.span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${tech.color}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {tech.name}
                    </motion.span>
                  ))}
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="font-semibold text-neutral-800 mb-2">
                    Key Features:
                  </h4>
                  <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                    <li>Responsive design for all devices</li>
                    <li>Smooth animations and micro-interactions</li>
                    <li>Modern component architecture</li>
                    <li>Optimized performance and caching</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Backend Stack */}
            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 font-display">
                  Backend & Infrastructure
                </h3>
              </div>

              <p className="text-neutral-600 mb-6 leading-relaxed">
                Robust Django backend with Redis caching, containerized
                deployment, and comprehensive monitoring.
              </p>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Django", color: "bg-green-100 text-green-700" },
                    { name: "PostgreSQL", color: "bg-blue-100 text-blue-700" },
                    { name: "Redis", color: "bg-red-100 text-red-700" },
                    { name: "Celery", color: "bg-orange-100 text-orange-700" },
                    { name: "Docker", color: "bg-cyan-100 text-cyan-700" },
                    { name: "Nginx", color: "bg-gray-100 text-gray-700" },
                    {
                      name: "Prometheus",
                      color: "bg-purple-100 text-purple-700",
                    },
                    { name: "Grafana", color: "bg-indigo-100 text-indigo-700" },
                  ].map((tech, index) => (
                    <motion.span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${tech.color}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {tech.name}
                    </motion.span>
                  ))}
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="font-semibold text-neutral-800 mb-2">
                    Key Features:
                  </h4>
                  <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                    <li>RESTful API architecture</li>
                    <li>Advanced conflict detection algorithms</li>
                    <li>Redis and Celery powered background logging</li>
                    <li>Containerized deployment with Docker</li>
                    <li>Real-time monitoring and analytics</li>
                    <li>PostgreSQL in production, MySQL in development</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Tech Details */}
          <motion.div
            className="mt-16 elegant-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4 font-display">
                Why These Technologies?
              </h3>
              <p className="text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                Every technology choice was made with student needs in mind:
                fast loading times, reliable performance, and a smooth user
                experience that works on any device.
                <span className="block mt-2 font-medium text-primary-700">
                  Plus, everything is open source so you can verify, audit, and
                  improve our choices.
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-neutral-800 mb-2">
                  Performance First
                </h4>
                <p className="text-sm text-neutral-600">
                  Lightning-fast load times and smooth interactions, powered by
                  Redis caching and optimized queries.
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-neutral-800 mb-2">
                  Student-Centered
                </h4>
                <p className="text-sm text-neutral-600">
                  Built specifically for university workflows and academic
                  scheduling needs, tested by real students.
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-neutral-800 mb-2">
                  Production-Ready
                </h4>
                <p className="text-sm text-neutral-600">
                  Containerized architecture with monitoring, scalable
                  infrastructure that grows with our user base.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <Github className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl font-display font-bold text-neutral-800">
                <span className="text-primary-600">Open Source</span> &
                Transparent
              </h2>
            </div>
            <p className="text-xl text-neutral-600 leading-relaxed">
              Every line of code is public. Every decision is documented. Every
              bug is fixable by the community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                  <Eye className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 font-display">
                  Complete Transparency
                </h3>
              </div>
              <p className="text-neutral-600 leading-relaxed mb-4">
                No black boxes, no hidden algorithms. See exactly how your data
                is processed, how schedules are generated, and how GPAs are
                calculated. Trust through transparency.
              </p>
              <ul className="text-sm text-neutral-600 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Full source code available on GitHub
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Detailed documentation for all APIs
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Open development roadmap
                </li>
              </ul>
            </motion.div>

            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 font-display">
                  Community-Driven
                </h3>
              </div>
              <p className="text-neutral-600 leading-relaxed mb-4">
                Found a bug? See a better way to do something? Want a new
                feature? The entire codebase is open for contributions,
                improvements, and community fixes.
              </p>
              <ul className="text-sm text-neutral-600 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Submit issues and bug reports
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Contribute features and improvements
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                  Review and audit the code yourself
                </li>
              </ul>
            </motion.div>
          </div>

          {/* CTA for GitHub */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="elegant-card rounded-2xl p-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <Github className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-4 font-display">
                Explore the Source Code
              </h3>
              <p className="text-primary-100 mb-6 leading-relaxed">
                Dive into the code, understand how everything works, report
                bugs, or contribute improvements. We believe in the power of
                open source and community collaboration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="https://github.com/brij0/coursescheduler" // Update with your actual repo URL
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github size={20} />
                  <span>View Source Code</span>
                </motion.a>
                <motion.a
                  href="https://github.com/brij0/coursescheduler/issues" // Update with your actual repo URL
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-all duration-300 shadow-lg border border-primary-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AlertTriangle size={20} />
                  <span>Report Issues</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
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
            <h2 className="text-4xl font-display font-bold mb-6 text-neutral-800">
              Let's <span className="text-primary-600">Connect</span>
            </h2>
            <p className="text-xl text-neutral-600">
              Got feedback? Found a bug? Want to contribute code? We'd love to
              hear from you!
              <span className="block mt-2 text-base font-medium text-primary-700">
                Check out our GitHub for issues, pull requests, and development
                discussions.
              </span>
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
              <h3 className="text-2xl font-bold mb-6 text-neutral-800 font-display">
                Get in Touch
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">Email</p>
                    <p className="text-neutral-600">hello@ugflow.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">
                      Response Time
                    </p>
                    <p className="text-neutral-600">Usually within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">We Love</p>
                    <p className="text-neutral-600">
                      Feature requests & bug reports
                    </p>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Your awesome name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-primary-600 hover:shadow-lg transition-all duration-300"
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
  );
};

export default AboutPage;
