import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { USER_KEY } from '../api/axiosInstance'
import { getMe } from '../api/authApi'

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
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe()
      const freshUser = {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        profilePicture: me.profilePicture,
        profileComplete: Boolean(me.profileComplete),
        jobTitle: me.jobTitle,
        bio: me.bio,
      }
      setUser(freshUser)
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser))
      return freshUser
    } catch {
      setUser(null)
      localStorage.removeItem(USER_KEY)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser, location.pathname])

  useEffect(() => {
    if (!user) return undefined

    const intervalId = setInterval(() => {
      refreshUser()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [refreshUser, user])

  useEffect(() => {
    const syncFromStorage = (event) => {
      if (event.key !== USER_KEY) return
      setUser(readStoredUser())
    }

    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isAdmin, refreshUser, loading }}>
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
