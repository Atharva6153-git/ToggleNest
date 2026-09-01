import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TOKEN_KEY } from '../api/axiosInstance'

function RequireAuth({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem(TOKEN_KEY))
    window.addEventListener('storage', syncToken)
    return () => window.removeEventListener('storage', syncToken)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireAuth