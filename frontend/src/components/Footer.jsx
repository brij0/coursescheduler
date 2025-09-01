import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Heart } from 'lucide-react'

const Footer = () => {
  const year = new Date().getFullYear()

  const linkBase =
    'text-xs sm:text-sm text-neutral-600 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 rounded transition-colors'

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top: Brand left, Links center, Feedback right */}
        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-8">
          {/* Brand (left) */}
          <div className="flex flex-col gap-3 min-w-[200px] md:pr-4">
            <Link
              to="/"
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 rounded-lg w-fit"
            >
              <motion.img
                src="/images/logo-removed-bg.png"
                alt="ugflow gryphon logo"
                className="w-10 h-10 object-contain"
                whileHover={{ rotate: -4, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              />
              <div className="ml-2 font-display font-black text-xl leading-none">
                <span className="text-primary-600">ug</span>
                <span className="text-neutral-800">flow</span>
              </div>
            </Link>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-[220px]">
              Your academic life, simplified.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com/brij0/coursescheduler"
                aria-label="GitHub repository"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
              >
                <Github className="w-4 h-4 text-neutral-700" />
              </a>
              <a
                href="mailto:uofgflow@gmail.com"
                aria-label="Email ugflow"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
              >
                <Mail className="w-4 h-4 text-neutral-700" />
              </a>
              <a
                href="https://www.linkedin.com/in/mann-uofg/"
                aria-label="Mann Modi on LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2]/40"
              >
                <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              </a>
            </div>
          </div>

            {/* Center Links */}
            <div className="md:flex-1">
              <div className="flex flex-col sm:flex-row justify-center gap-10 text-left sm:text-left md:text-center">
                <nav aria-label="Product" className="space-y-2">
                  <h3 className="text-[11px] font-semibold tracking-wide text-neutral-800 uppercase">Product</h3>
                  <ul className="space-y-1">
                    <li><Link to="/gpa-calculator" className={linkBase}>GPA Calculator</Link></li>
                    <li><Link to="/conflict-free-schedule" className={linkBase}>Scheduler</Link></li>
                    <li><Link to="/schedule" className={linkBase}>Assignment Calendar</Link></li>
                    <li><Link to="/coop-forum" className={linkBase}>Co-op Forum</Link></li>
                  </ul>
                </nav>
                <nav aria-label="Resources" className="space-y-2">
                  <h3 className="text-[11px] font-semibold tracking-wide text-neutral-800 uppercase">Resources</h3>
                  <ul className="space-y-1">
                    <li><Link to="/about" className={linkBase}>About</Link></li>
                    <li><Link to="/privacy" className={linkBase}>Privacy Policy</Link></li>
                    <li>
                      <a
                        href="https://github.com/brij0/coursescheduler"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkBase}
                      >
                        Open Source
                      </a>
                    </li>
                    <li>
                      <a
                        href="mailto:uofgflow@gmail.com"
                        className={linkBase}
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            {/* Feedback / Stay Updated (right) */}
            <div className="space-y-2 md:w-[220px] md:text-right">
              <h3 className="text-[11px] font-semibold tracking-wide text-neutral-800 uppercase">Stay Updated</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                New features roll out often. Feedback welcome.
              </p>
              <p className="text-xs text-neutral-500">
                <a
                  href="mailto:uofgflow@gmail.com"
                  className="underline underline-offset-2 hover:text-primary-600 transition-colors"
                >
                  uofgflow@gmail.com
                </a>
              </p>
            </div>
        </div>

        {/* Divider / Bottom */}
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-neutral-500">
              &copy; {year} ugflow. All Rights Reserved.
            </p>
            <p className="flex items-center text-[11px] text-neutral-500">
              Made with
              <motion.span
                className="mx-1 inline-flex"
                aria-label="love"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, repeatType: 'loop' }}
              >
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              </motion.span>
              for Students, by Students.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer