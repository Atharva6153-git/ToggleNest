import { useNavigate } from 'react-router-dom'

function Layout({ children }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('user') || 'null')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          ToggleNest
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => navigate('/')}>
            Projects
          </button>

          <button onClick={() => navigate('/projects/create')}>
            Create Project
          </button>

          <button onClick={() => navigate('/kanban')}>
            Kanban Board
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
            {user && <span className="topbar-user">{user.name}</span>}
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default Layout