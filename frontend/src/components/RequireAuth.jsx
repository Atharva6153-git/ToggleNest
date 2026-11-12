import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // The session is an httpOnly cookie, so authentication is determined by the
  // server-backed user state rather than anything readable/storable in JS.
  if (loading) {
    return (
      <div className="route-loading" role="status" aria-label="Loading">
        <span className="route-loading-spinner" aria-hidden="true" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.profileComplete === false && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return children
}

export default RequireAuth
