import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, Lock, Users, Database, Cookie, Mail, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'

const PrivacyPage = () => {
  const sections = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Information We Collect",
      content: [
        "Account information (email, name) when you choose to register",
        "Course data you input for scheduling and GPA calculations",
        "Usage analytics to improve our services (anonymized)",
        "Cookies for authentication and preferences"
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "How We Use Your Data",
      content: [
        "Provide personalized course scheduling recommendations",
        "Calculate and track your GPA progress",
        "Improve our services based on usage patterns",
        "Send important updates about your account (if registered)"
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Protection",
      content: [
        "All data is encrypted in transit and at rest",
        "We use industry-standard security practices",
        "Regular security audits and updates",
        "Limited access to personal data by our team"
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Data Sharing",
      content: [
        "We never sell your personal information",
        "No sharing with third parties for marketing",
        "Anonymous usage statistics may be shared for research",
        "Legal compliance only when required by law"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
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
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-medium text-neutral-700">Your Privacy Matters</span>
            </motion.div>

            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-6 shadow-lg emerald-glow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-neutral-800">
              Privacy Policy
            </h1>
            
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Your privacy matters to us. Here's how we protect and handle your data 
              with complete transparency.
            </p>
            
            <div className="elegant-card rounded-lg p-6 shadow-lg">
              <p className="text-sm text-neutral-500">
                <strong>Last Updated:</strong> January 15, 2025
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="elegant-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-neutral-800 font-display">
                The Simple Version
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                We built SmartGryph to help students, not to harvest data. We collect only what's 
                necessary to make the app work, we protect it like it's our own, and we never sell it. 
                Period. Most features work without even creating an account.
              </p>
            </div>
          </motion.div>

          {/* Privacy Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="elegant-card rounded-2xl p-8"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <div className="text-primary-600">
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 font-display">
                    {section.title}
                  </h3>
                </div>
                
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-neutral-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Additional Sections */}
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <Cookie className="w-6 h-6 text-accent-500 mr-3" />
                <h3 className="text-xl font-bold text-neutral-800 font-display">Cookies & Tracking</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                We use minimal cookies for authentication and preferences. No creepy tracking, 
                no following you around the internet. Just the basics to make the app work smoothly.
              </p>
            </motion.div>

            <motion.div
              className="elegant-card rounded-2xl p-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-neutral-800 font-display">Your Rights</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                You can access, update, or delete your data anytime. Want to export everything? 
                Just ask. Want to be forgotten? We'll make it happen. Your data, your choice.
              </p>
            </motion.div>
          </div>

          {/* Google Services Notice */}
          <motion.div
            className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-2xl p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold text-primary-800 mb-4 font-display">
              Google Services Integration
            </h3>
            <p className="text-primary-700 leading-relaxed mb-4">
              When you choose to connect your Google Calendar, we only access what's necessary to add your 
              course events. We don't read your existing calendar or store your Google credentials.
            </p>
            <p className="text-sm text-primary-600">
              This integration is optional and can be disconnected at any time through your Google account settings.
            </p>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            className="mt-16 text-center elegant-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-neutral-800 mb-4 font-display">
              Questions About Privacy?
            </h3>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              We're real people, not a faceless corporation. If you have any questions about how we 
              handle your data, just reach out. We promise to give you a straight answer.
            </p>
            <motion.a
              href="mailto:privacy@smartgryph.com"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg emerald-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mail size={20} />
              <span>privacy@smartgryph.com</span>
            </motion.a>
          </motion.div>

          {/* Legal Footer */}
          <div className="mt-16 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 text-center leading-relaxed">
              This privacy policy is effective as of January 15, 2025. We may update it occasionally, 
              but we'll always notify you of significant changes. By using SmartGryph, you agree to 
              this privacy policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PrivacyPage