import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast, Toaster } from 'react-hot-toast'
import Layout from '../components/Layout'
import { getProject, updateProject, deleteProject } from '../api/projectApi'

function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await getProject(id)
        setName(project.name)
        setDescription(project.description || '')
        setDeadline(project.deadline ? project.deadline.slice(0, 10) : '')
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load the project.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id, navigate])

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!name || !description || !deadline) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)

    try {
      await updateProject(id, {
        name,
        description,
        deadline: new Date(`${deadline}T00:00:00`).toISOString(),
      })
      toast.success('Project updated successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this project?'
    )

    if (!confirmDelete) {
      return
    }

    setIsSubmitting(true)

    try {
      await deleteProject(id)
      toast.success('Project deleted successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <p className="empty-state">Loading project...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Toaster position="top-right" />
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Project'}
                </button>

                <button
                  className="delete-btn"
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete Project
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => navigate(`/projects/${id}/board`)}
                >
                  Open Board
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