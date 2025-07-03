import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const items = ['Home','About','Events','Privacy'];
  return (
    <motion.aside
      className="hidden lg:block w-[280px] bg-neutral-surface border-r border-neutral-borderLight pt-24 px-4 overflow-y-auto"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="space-y-2">
        {items.map(label => (
          <NavLink
            key={label}
            to={label==='Home'? '/' : `/${label.toLowerCase()}`}
            className={({ isActive }) =>
              `block h-12 flex items-center px-4 rounded-lg transition-all duration-200
               ${isActive ? 'bg-primary-light text-primary-dark' : 'text-text-secondary hover:bg-neutral-borderLight'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}