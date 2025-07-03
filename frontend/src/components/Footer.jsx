import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-neutral-surface border-t border-neutral-borderLight py-4 mt-4">
      <div className="text-center text-text-muted text-sm">
        © {new Date().getFullYear()} CourseScheduler. All rights reserved.
      </div>
    </footer>
  );
}