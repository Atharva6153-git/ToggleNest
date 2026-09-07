import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getProjects } from '../api/projectApi'

const Projects = () => {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load projects.')
      })
      .finally(() => setLoading(false))
  }, [])

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline'
    const date = new Date(deadline)
    if (Number.isNaN(date.getTime())) return deadline
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Layout>
      <div className="page-container">

        {/* Page Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>My Projects</h1>
            <p>Organize, manage and keep track of your work.</p>
          </div>

          <button
            className="create-btn"
            onClick={() => navigate('/projects/create')}
          >
            + Create Project
          </button>
        </div>

        {loading ? (
          <p className="page-state">Loading projects...</p>
        ) : error ? (
          <p className="page-state page-state-error">{error}</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to get started.</p>
          </div>
        ) : (

          /* Project Cards */
          <div className="projects-grid">

            {projects.map((project) => (
              <div className="project-card" key={project._id}>

                {/* Card Top */}
                <div className="project-card-top">
                  <span className="status-badge">
                    Active
                  </span>

                  <span className="project-id">
                    #{String(project._id).slice(-4)}
                  </span>
                </div>

                {/* Project Information */}
                <h2>{project.name}</h2>

                <p className="project-description">
                  {project.description || 'No description provided.'}
                </p>

                {/* Deadline */}
                <div className="project-meta">
                  <span>📅</span>

                  <div>
                    <small>Deadline</small>
                    <p>{formatDeadline(project.deadline)}</p>
                  </div>
                </div>

                {/* Manage Button */}
                <div className="project-card-footer">
                  <button
                    className="manage-btn"
                    onClick={() =>
                      navigate(`/projects/edit/${project._id}`)
                    }
                  >
                    Manage Project →
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </Layout>
  )
}

export default Projects