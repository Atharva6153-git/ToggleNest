import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/authApi'
import NotificationBell from './NotificationBell'
import ThemeToggleButton from './ThemeToggleButton'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, FolderKanban, Plus } from 'lucide-react'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin } = useAuth()

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'S'
  const pathname = location.pathname

  const isDashboardActive = pathname === '/dashboard'
  const isProjectsActive =
    pathname.startsWith('/projects') && pathname !== '/projects/create'
  const isCreateActive = pathname === '/projects/create'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">ToggleNest</div>

        <nav className="sidebar-nav">
          <button
            className={isDashboardActive ? 'active' : ''}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className={isProjectsActive ? 'active' : ''}
            onClick={() => navigate('/projects')}
          >
            <FolderKanban size={18} />
            Projects
          </button>
          {isAdmin && (
            <button
              className={isCreateActive ? 'active' : ''}
              onClick={() => navigate('/projects/create')}
            >
              <Plus size={18} />
              Create Project
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <span
            className="sidebar-profile"
            onClick={() => navigate('/profile')}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="sidebar-profile-img"
              />
            ) : (
              <span className="sidebar-profile-initial">{initial}</span>
            )}
            <span className="sidebar-profile-name">
              {user?.name || 'User'}
            </span>
          </span>
          <button className="sidebar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h3>Workspace</h3>
            <p>Manage your projects efficiently</p>
          </div>

          <div className="topbar-actions">
            <ThemeToggleButton />
            <NotificationBell />
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default Layout
