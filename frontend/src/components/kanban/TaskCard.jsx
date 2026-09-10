import { motion } from 'framer-motion'

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

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
}

function TaskCard({ task, onClick, provided, snapshot }) {
  const assigneeName = task?.assignedTo?.name || task?.assignedTo || 'Unassigned'
  const dueDate = formatDate(task?.dueDate)
  const priorityLabel = task?.priority || 'Medium'
  const priorityBorderClass = `priority-border-${String(priorityLabel).toLowerCase()}`

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
        <span className={`priority-badge ${getPriorityClass(priorityLabel)}`}>
          {priorityLabel}
        </span>
      </div>

      <div className="kanban-card-meta">
        <span>
          <strong>Due:</strong> {dueDate}
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
