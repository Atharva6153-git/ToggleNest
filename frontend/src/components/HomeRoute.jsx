import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TOKEN_KEY } from '../api/axiosInstance'

function HomeRoute({ children }) {
  const { user, loading } = useAuth()

  const token = localStorage.getItem(TOKEN_KEY)

  if (token && (loading || !user)) {
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