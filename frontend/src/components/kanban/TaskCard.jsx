import { motion } from 'framer-motion'
import { CalendarClock } from 'lucide-react'

function formatDate(dateValue) {
  if (!dateValue) return 'No due date'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'No due date'
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getPriorityClass(priority = 'Medium') {
  return `priority-${String(priority).toLowerCase()}`
}

function getInitials(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return '?'

  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

function TaskCard({ task, onClick, provided, snapshot }) {
  const assigneeName = task?.assignedTo?.name || task?.assignedTo || 'Unassigned'
  const assigneeInitials = getInitials(assigneeName)
  const dueDate = formatDate(task?.dueDate)
  const priorityLabel = task?.priority || 'Medium'
  const priorityBorderClass = `priority-border-${String(priorityLabel).toLowerCase()}`

  const dueTime = task?.dueDate ? new Date(task.dueDate).getTime() : null
  const isOverdue =
    task?.status !== 'Done' &&
    dueTime !== null &&
    !Number.isNaN(dueTime) &&
    dueTime < Date.now()

  return (
    <article
      className={snapshot?.isDragging ? 'kanban-card-drag-wrap is-dragging' : 'kanban-card-drag-wrap'}
      ref={provided?.innerRef}
      {...provided?.dragHandleProps}
      {...provided?.draggableProps}
    >
      <motion.div
        className={`kanban-card ${priorityBorderClass} ${snapshot?.isDragging ? 'is-dragging' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        variants={cardVariants}
        whileHover={snapshot?.isDragging ? undefined : { y: -6, scale: 1.01 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
      <div className="kanban-card-header">
        <h3 className="kanban-task-title">{task?.title || 'Untitled task'}</h3>
        <div className="kanban-card-badges">
          <span className={`priority-badge ${getPriorityClass(priorityLabel)}`}>
            {priorityLabel}
          </span>
          <span
            className={`kanban-avatar ${assigneeName === 'Unassigned' ? 'kanban-avatar-unassigned' : ''}`}
            title={assigneeName}
            aria-label={`Assigned to ${assigneeName}`}
          >
            {assigneeInitials}
          </span>
        </div>
      </div>

      <div className="kanban-card-meta">
        <span className={isOverdue ? 'kanban-due is-overdue' : 'kanban-due'}>
          <CalendarClock size={13} aria-hidden="true" />
          <strong>Due:</strong> {dueDate}
          {isOverdue && <span className="kanban-overdue-tag">Overdue</span>}
        </span>
        <span>
          <strong>Assignee:</strong> {assigneeName}
        </span>
      </div>
      </motion.div>
    </article>
  )
}

export default TaskCard
