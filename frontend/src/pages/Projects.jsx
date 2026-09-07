import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

const Projects = () => {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])

  useEffect(() => {
    const savedProjects =
      JSON.parse(localStorage.getItem('projects')) || []

    setProjects(savedProjects)
  }, [])

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

        {/* No Projects */}
        {projects.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to get started.</p>
          </div>
        ) : (

          /* Project Cards */
          <div className="projects-grid">

            {projects.map((project) => (
              <div className="project-card" key={project.id}>

                {/* Card Top */}
                <div className="project-card-top">
                  <span className="status-badge">
                    Active
                  </span>

                  <span className="project-id">
                    #{String(project.id).slice(-4)}
                  </span>
                </div>

                {/* Project Information */}
                <h2>{project.name}</h2>

                <p className="project-description">
                  {project.description}
                </p>

                {/* Deadline */}
                <div className="project-meta">
                  <span>📅</span>

                  <div>
                    <small>Deadline</small>
                    <p>{project.deadline}</p>
                  </div>
                </div>

                {/* Manage Button */}
                <div className="project-card-footer">
                  <button
                    className="manage-btn"
                    onClick={() =>
                      navigate(`/projects/edit/${project.id}`)
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