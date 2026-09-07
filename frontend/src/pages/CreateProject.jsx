import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { createProject } from '../api/projectApi'


function CreateProject() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!name || !description || !deadline) {
    alert('Please fill all fields')
    return
  }

  setSubmitting(true)

  try {
    await createProject({ name, description, deadline })
    alert('Project created successfully!')
    navigate('/')
  } catch (err) {
    alert(err?.response?.data?.message || 'Could not create the project.')
  } finally {
    setSubmitting(false)
  }
}

return (
    <Layout>
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
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
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
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
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