import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { deleteProject, getProjectById, updateProject } from '../api/projectApi'

function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getProjectById(id)
      .then((project) => {
        setName(project.name)
        setDescription(project.description || '')
        setDeadline(project.deadline ? String(project.deadline).slice(0, 10) : '')
      })
      .catch((err) => {
        alert(err?.response?.data?.message || 'Could not load the project.')
        navigate('/')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!name || !description || !deadline) {
      alert('Please fill all fields')
      return
    }

    setSubmitting(true)

    try {
      await updateProject(id, { name, description, deadline })
      alert('Project updated successfully!')
      navigate('/')
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update the project.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this project?'
    )

    if (!confirmDelete) {
      return
    }

    try {
      await deleteProject(id)
      alert('Project deleted successfully!')
      navigate('/')
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not delete the project.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <p className="page-state">Loading project...</p>
        </div>
      </Layout>
    )
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
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Project'}
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