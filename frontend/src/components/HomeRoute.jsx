import { Navigate } from 'react-router-dom'
import { TOKEN_KEY } from '../api/axiosInstance'

function HomeRoute({ children }) {
  if (localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default HomeRoute