import { useNavigate } from 'react-router-dom'

function Layout({ children }) {
  const navigate = useNavigate()

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
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h3>Workspace</h3>
            <p>Manage your projects efficiently</p>
          </div>

          <div className="profile-circle">
            S
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default Layout