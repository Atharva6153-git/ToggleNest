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
    const loadProjects = async () => {
      try {
        const data = await getProjects()
        setProjects(data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load projects.')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const formattedDeadline = (date) => {
    if (!date) return 'No deadline'
    return new Date(date).toLocaleDateString()
  }

  return (
    <Layout>
      <div className="page-container">
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
          <p className="empty-state">Loading projects...</p>
        ) : error ? (
          <p className="empty-state">{error}</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to get started.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div className="project-card" key={project._id}>
                <div className="project-card-top">
                  <span className="status-badge">Active</span>
                  <span className="project-id">
                    #{String(project._id).slice(-4)}
                  </span>
                </div>

                <h2>{project.name}</h2>

                <p className="project-description">{project.description}</p>

                <div className="project-meta">
                  <span>📅</span>
                  <div>
                    <small>Deadline</small>
                    <p>{formattedDeadline(project.deadline)}</p>
                  </div>
                </div>

                <div className="project-card-footer">
                  <button
                    className="manage-btn"
                    onClick={() => navigate(`/projects/${project._id}/board`)}
                  >
                    Open Board →
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() =>
                      navigate(`/projects/edit/${project._id}`)
                    }
                  >
                    Manage
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