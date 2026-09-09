import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'react-hot-toast'
import Layout from '../components/Layout'
import { createProject } from '../api/projectApi'

function CreateProject() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !description || !deadline) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)

    try {
      await createProject({
        name,
        description,
        deadline: new Date(`${deadline}T00:00:00`).toISOString(),
      })
      toast.success('Project created successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create the project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="page-container">
        <div className="form-wrapper">
          <div className="form-card">
            <h1>Create Project</h1>
            <p className="form-subtitle">
              Add a new project and start organizing your work.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ToggleNest Dashboard"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
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

export default CreateProject