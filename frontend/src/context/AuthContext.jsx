import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      apiClient.defaultHeaders['Authorization'] = `Bearer ${token}`
      apiClient.get('/api/auth/me')
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('token')
          delete apiClient.defaultHeaders['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await apiClient.post('/api/auth/login', { username, password })
    localStorage.setItem('token', res.token)
    apiClient.defaultHeaders['Authorization'] = `Bearer ${res.token}`
    setUser(res.user)
    return res.user
  }

  const logout = () => {
    apiClient.post('/api/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    delete apiClient.defaultHeaders['Authorization']
    setUser(null)
  }

  const hardLogout = () => {
    localStorage.removeItem('token')
    delete apiClient.defaultHeaders['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hardLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext }
