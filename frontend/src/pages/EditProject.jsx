import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'

function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    const projects =
      JSON.parse(localStorage.getItem('projects')) || []

    const project = projects.find(
      (project) => String(project.id) === String(id)
    )

    if (project) {
      setName(project.name)
      setDescription(project.description)
      setDeadline(project.deadline)
    }
  }, [id])

  const handleUpdate = (e) => {
    e.preventDefault()

    if (!name || !description || !deadline) {
      alert('Please fill all fields')
      return
    }

    const projects =
      JSON.parse(localStorage.getItem('projects')) || []

    const updatedProjects = projects.map((project) =>
      String(project.id) === String(id)
        ? {
            ...project,
            name,
            description,
            deadline
          }
        : project
    )

    localStorage.setItem(
      'projects',
      JSON.stringify(updatedProjects)
    )

    alert('Project updated successfully!')

    navigate('/')
  }

  const handleDelete = () => {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this project?'
  )

  if (!confirmDelete) {
    return
  }

  const projects =
    JSON.parse(localStorage.getItem('projects')) || []

  const updatedProjects = projects.filter(
    (project) => String(project.id) !== String(id)
  )

  localStorage.setItem(
    'projects',
    JSON.stringify(updatedProjects)
  )

  alert('Project deleted successfully!')

  navigate('/')
}

  return (
    <Layout>
  <div className="page-container">
    <div className="form-wrapper">
      <div className="form-card">

        <h1>Manage Project</h1>

        <p className="form-subtitle">
          Update your project details or delete the project.
        </p>

        <form onSubmit={handleUpdate}>

          <div className="form-group">
            <label>Project Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
            />
          </div>

          <div className="form-group">
            <label>Deadline</label>

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-actions">

            <button
              className="primary-btn"
              type="submit"
            >
              Update Project
            </button>

            <button
              className="delete-btn"
              type="button"
              onClick={handleDelete}
            >
              Delete Project
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>

          </div>

        </form>
      </div>
    </div>
  </div>
  </Layout>
)
}

export default EditProject