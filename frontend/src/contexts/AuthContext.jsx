import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/user/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true, message: `Welcome back, ${data.user.username}!` }
      } else {
        return { success: false, message: data.error || 'Login failed. Please try again.' }
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please check your connection and try again.' }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error || 'Registration failed. Please try again.' }
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please check your connection and try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${BACKEND_API_URL}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}