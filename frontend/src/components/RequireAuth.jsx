import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TOKEN_KEY } from '../api/axiosInstance'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading || !user) {
    return (
      <div className="route-loading" role="status" aria-label="Loading">
        <span className="route-loading-spinner" aria-hidden="true" />
      </div>
    )
  }

  if (user.profileComplete === false && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return children
}

export default RequireAuth