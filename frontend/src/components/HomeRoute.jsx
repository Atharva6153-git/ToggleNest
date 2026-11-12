import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function HomeRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-loading" role="status" aria-label="Loading">
        <span className="route-loading-spinner" aria-hidden="true" />
      </div>
    )
  }

  if (user) {
    return user.profileComplete === false ? (
      <Navigate to="/complete-profile" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }

  return children
}

export default HomeRoute
