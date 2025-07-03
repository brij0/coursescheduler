import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const links = ['Home','About','Events','Privacy'];
  return (
    <motion.header
      className="fixed top-0 left-0 w-full bg-white bg-opacity-95 backdrop-blur border-b border-neutral-border z-50 px-6
                     h-[56px] md:h-[64px] lg:h-[72px] flex items-center"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between w-full max-w-screen-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">CourseScheduler</h1>
        <nav className="hidden lg:flex space-x-4">
          {links.map(label => (
            <NavLink
              key={label}
              to={ label==='Home' ? '/' : `/${label.toLowerCase()}` }
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
                 ${isActive ? 'bg-primary-light text-primary-dark' : 'text-text-secondary hover:bg-neutral-borderLight'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}