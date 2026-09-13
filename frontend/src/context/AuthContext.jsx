import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TOKEN_KEY } from '../api/axiosInstance'
import { getMe } from '../api/authApi'

const USER_KEY = 'user'
const REFRESH_INTERVAL_MS = 30000

const AuthContext = createContext(undefined)

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const location = useLocation()
  const [user, setUser] = useState(readStoredUser)

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null)
      return null
    }

    try {
      const me = await getMe()
      const freshUser = { id: me.id, name: me.name, email: me.email, role: me.role }
      setUser(freshUser)
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser))
      return freshUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser, location.pathname])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (localStorage.getItem(TOKEN_KEY)) {
        refreshUser()
      }
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [refreshUser])

  useEffect(() => {
    const syncFromStorage = (event) => {
      if (event.key !== USER_KEY && event.key !== TOKEN_KEY) return
      if (event.key === TOKEN_KEY && !event.newValue) {
        setUser(null)
        return
      }
      setUser(readStoredUser())
    }

    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}