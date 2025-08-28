import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Heart, Calendar, Calculator, Users, Info, Shield, ArrowUpRight } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Logo and Branding - Takes 4 columns on md screens */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/images/logo-removed-bg.png" 
                alt="ugflow logo"
                className="w-16 h-16 object-contain" 
              />
            </Link>
            <div className="font-display font-bold text-3xl mb-4">
              <span className="text-primary-600">ug</span>
              <span className="text-neutral-800">flow</span>
            </div>
            <p className="text-neutral-600 text-sm text-center md:text-left">
              Your academic life, simplified.
            </p>
          </div>

          {/* Navigation Links - Takes 4 columns on md screens */}
          <div className="md:col-span-4">
            <h3 className="font-semibold text-neutral-800 text-lg mb-5 text-center md:text-left">
              Resources
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <Link 
                to="/gpa-calculator" 
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <Calculator className="w-5 h-5 text-primary-500 mr-3" />
                <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">
                  GPA Calculator
                </span>
                <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary-500 transition-opacity" />
              </Link>
              
              <Link 
                to="/conflict-free-schedule" 
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-primary-500 mr-3" />
                <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">
                  Schedule Builder
                </span>
                <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary-500 transition-opacity" />
              </Link>
              
              <Link 
                to="/coop-forum" 
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <Users className="w-5 h-5 text-primary-500 mr-3" />
                <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">
                  Co-op Forum
                </span>
                <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary-500 transition-opacity" />
              </Link>
            </div>
            
            <div className="border-t border-neutral-100 my-4"></div>
            
            <div className="grid grid-cols-1 gap-2">
              <Link 
                to="/about" 
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <Info className="w-5 h-5 text-neutral-500 mr-3" />
                <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">
                  About Us
                </span>
              </Link>
              
              <Link 
                to="/privacy" 
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <Shield className="w-5 h-5 text-neutral-500 mr-3" />
                <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">
                  Privacy Policy
                </span>
              </Link>
            </div>
          </div>

          {/* Connect Links - Takes 4 columns on md screens */}
          <div className="md:col-span-4">
            <h3 className="font-semibold text-neutral-800 text-lg mb-5 text-center md:text-left">
              Connect
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <a 
                href="https://github.com/brij0/coursescheduler" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                  <Github className="w-4 h-4 text-neutral-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">GitHub</span>
                  <span className="text-xs text-neutral-500">View our source code</span>
                </div>
                <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-neutral-500 transition-opacity" />
              </a>
              
              <a 
                href="mailto:uofgflow@gmail.com"
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-neutral-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">Email Us</span>
                  <span className="text-xs text-neutral-500">uofgflow@gmail.com</span>
                </div>
                <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-neutral-500 transition-opacity" />
              </a>
              
              <div className="border-t border-neutral-100 my-3"></div>
              
              <p className="text-sm text-neutral-600 px-4">Our developers:</p>
              
              <a 
                href="https://www.linkedin.com/in/mann-uofg/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[#0A66C2]/10 flex items-center justify-center mr-3">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">Mann Modi</span>
                  <span className="text-xs text-neutral-500">Frontend Developer & UI/UX</span>
                </div>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/brijeshthakrar/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[#0A66C2]/10 flex items-center justify-center mr-3">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 group-hover:text-primary-600 transition-colors">Brijesh Thakrar</span>
                  <span className="text-xs text-neutral-500">Backend Developer & Architect</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Made with Love Message */}
        <div className="border-t border-neutral-200 mt-12 pt-6 text-center">
          <p className="flex items-center justify-center text-neutral-600 text-sm">
            Made with 
            <motion.div 
              className="inline-block mx-2 text-red-500"
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Heart className="w-4 h-4 fill-current" />
            </motion.div>
            for students, by students.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer