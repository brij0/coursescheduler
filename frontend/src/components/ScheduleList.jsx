import React from 'react';
import { motion } from 'framer-motion';

export default function ScheduleList({ events }) {
  return (
    <div className="space-y-4 mt-6">
      {Object.entries(events).map(([course, slots]) => (
        <motion.div
          key={course}
          className="bg-neutral-surface border border-neutral-border rounded-[12px] p-6 shadow hover:shadow-lg transition-all duration-200"
          whileHover={{ y:-2 }}
        >
          <h3 className="text-2xl font-semibold mb-2 leading-tight">{course}</h3>
          <ul className="text-base text-text-secondary list-disc list-inside">
            {slots.map((s,i)=>(
              <li key={i}>{s.day} {s.time} @ {s.location}</li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}