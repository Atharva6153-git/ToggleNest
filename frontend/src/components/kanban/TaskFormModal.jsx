import { useEffect, useState } from 'react'
import UserSelector from './UserSelector'

const emptyForm = {
  title: '',
  description: '',
  priority: 'Medium',
  dueDate: '',
  assignedTo: '',
}

function TaskFormModal({ isOpen, isSubmitting, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm)
    }
  }, [isOpen])

  if (!isOpen) return null

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    const normalizedDueDate = form.dueDate
      ? new Date(`${form.dueDate}T00:00:00`).toISOString()
      : undefined

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: normalizedDueDate,
      ...(form.assignedTo ? { assignedTo: form.assignedTo } : {}),
      status: 'To-Do',
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Task</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close form">
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
              placeholder="Add a task title"
              required
            />
          </label>

          <label className="kanban-field">
            <span>Description</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={updateField('description')}
              placeholder="Add details for this task"
            />
          </label>

          <div className="task-form-row">
            <label className="kanban-field">
              <span>Priority</span>
              <select value={form.priority} onChange={updateField('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="kanban-field">
              <span>Due date</span>
              <input type="date" value={form.dueDate} onChange={updateField('dueDate')} />
            </label>
          </div>

          <UserSelector value={form.assignedTo} onChange={(value) => setForm((currentForm) => ({ ...currentForm, assignedTo: value }))} />

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="kanban-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskFormModal
