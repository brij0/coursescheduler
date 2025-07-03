/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a90e2',
          dark: '#2c5aa0',
          light: '#e3f2fd'
        },
        neutral: {
          background: '#fafbfc',
          surface: '#ffffff',
          border: '#e1e8ed',
          borderLight: '#f0f4f8'
        },
        text: {
          primary: '#2c3e50',
          secondary: '#64748b',
          muted: '#94a3b8'
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};