import { useNavigate } from 'react-router-dom'
import { logout } from '../api/authApi'

function Layout({ children }) {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'S'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">ToggleNest</div>

        <nav className="sidebar-nav">
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button onClick={() => navigate('/')}>Projects</button>
          <button onClick={() => navigate('/projects/create')}>
            Create Project
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h3>Workspace</h3>
            <p>Manage your projects efficiently</p>
          </div>

          <div className="topbar-actions">
            <span className="profile-circle">{initial}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default Layout