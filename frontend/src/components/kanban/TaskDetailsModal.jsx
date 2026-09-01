import { useEffect, useState } from 'react'
import UserSelector from './UserSelector'

function getAssignedUserValue(assignedTo) {
  if (!assignedTo) return ''
  if (typeof assignedTo === 'string') return assignedTo
  if (typeof assignedTo === 'object') {
    return assignedTo._id || assignedTo.id || ''
  }
  return ''
}

function TaskDetailsModal({ task, isOpen, isSubmitting, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'To-Do',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
  })

  useEffect(() => {
    if (task && isOpen) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'To-Do',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        assignedTo: getAssignedUserValue(task.assignedTo),
      })
    }
  }, [task, isOpen])

  if (!isOpen || !task) return null

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      assignedTo: form.assignedTo || undefined,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close editor">
            ×
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="kanban-field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <label className="kanban-field">
            <span>Description</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={updateField('description')}
            />
          </label>

          <div className="task-form-row">
            <label className="kanban-field">
              <span>Status</span>
              <select value={form.status} onChange={updateField('status')}>
                <option value="To-Do">To-Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </label>

            <label className="kanban-field">
              <span>Priority</span>
              <select value={form.priority} onChange={updateField('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>

          <div className="task-form-row">
            <label className="kanban-field">
              <span>Due date</span>
              <input type="date" value={form.dueDate} onChange={updateField('dueDate')} />
            </label>

            <UserSelector
              value={form.assignedTo}
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, assignedTo: value }))}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="danger-button" onClick={onDelete}>
              Delete Task
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="kanban-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskDetailsModal
