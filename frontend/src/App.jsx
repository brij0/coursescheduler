import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoadingScreen from './components/LoadingScreen'
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

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
          <Route path="/gpa-calculator" element={<GPACalculatorPage />} />
          <Route path="/coop-forum" element={<CoopForumPage />} />
          <Route path="/schedule" element={<EventBuilderPage/>} />
          <Route path="/conflict-free-schedule" element={<ConflictFreeSchedulePage />} />
          <Route path="/coop-forum/post/:id" element={<PostPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App