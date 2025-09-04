import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import AuthPage from './pages/AuthPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import GPACalculatorPage from './pages/GPACalculatorPage'
import CoopForumPage from './pages/CoopForumPage' 
import PostPage from './pages/PostPage'
import SchedulerPage from './pages/SchedulerPage'
import ConflictFreeSchedulePage from './pages/ConflictFreeSchedulePage'
import EventBuilderPage from './pages/EventBuilderPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import { HelmetProvider } from 'react-helmet-async'
import VerificationSuccessPage from './pages/VerificationSuccessPage'

function App() {
  // Check if this is the first load in this session
  const [isLoading, setIsLoading] = useState(() => {
    // Check if we've already loaded the app in this session
    const hasLoadedBefore = sessionStorage.getItem('hasLoadedApp')
    return !hasLoadedBefore
  })

  useEffect(() => {
    if (isLoading) {
      // Only run the timer if we're actually loading
      const timer = setTimeout(() => {
        setIsLoading(false)
        // Mark that we've loaded the app
        sessionStorage.setItem('hasLoadedApp', 'true')
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (isLoading) {
    return <LoadingScreen />
  }
  
  return (
    <HelmetProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
          <ScrollToTop />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
              <Route path="/verify-success" element={<VerificationSuccessPage />} />
              <Route path="/gpa-calculator" element={<GPACalculatorPage />} />
              <Route path="/coop-forum" element={<CoopForumPage />} />
              <Route path="/scheduler" element={<Navigate to="/conflict-free-schedule" replace />} />
              <Route path="/conflict-free-schedule" element={<ConflictFreeSchedulePage />} />
              <Route path="/schedule" element={<EventBuilderPage />} />
              <Route path="/coop-forum/post/:id" element={<PostPage />} />
              <Route path="/scheduler" element={<SchedulerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App