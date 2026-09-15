import { motion } from 'framer-motion'
import { CalendarClock, AlertTriangle, Circle, ArrowDown } from 'lucide-react'

function formatDate(dateValue) {
  if (!dateValue) return null

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
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

function getPriorityConfig(priority = 'Medium') {
  switch (priority) {
    case 'High':
      return { icon: AlertTriangle, label: 'High', className: 'priority-chip-high' }
    case 'Low':
      return { icon: ArrowDown, label: 'Low', className: 'priority-chip-low' }
    default:
      return { icon: Circle, label: 'Medium', className: 'priority-chip-medium' }
  }
}

const AVATAR_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4']

function getAvatarColor(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function TaskCard({ task, onClick, provided, snapshot }) {
  const assigneeName = task?.assignedTo?.name || null
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : null
  const description = task?.description || ''
  const dueDate = formatDate(task?.dueDate)
  const priorityLabel = task?.priority || 'Medium'
  const { icon: PriorityIcon, label: priorityText, className: priorityClass } =
    getPriorityConfig(priorityLabel)

  const dueTime = task?.dueDate ? new Date(task.dueDate).getTime() : null
  const now = Date.now()
  const isOverdue =
    task?.status !== 'Done' &&
    dueTime !== null &&
    !Number.isNaN(dueTime) &&
    dueTime < now
  const isDueSoon =
    !isOverdue &&
    task?.status !== 'Done' &&
    dueTime !== null &&
    !Number.isNaN(dueTime) &&
    dueTime - now < 3 * 24 * 60 * 60 * 1000

  return (
    <article
      className={snapshot?.isDragging ? 'kanban-card-drag-wrap is-dragging' : 'kanban-card-drag-wrap'}
      ref={provided?.innerRef}
      {...provided?.dragHandleProps}
      {...provided?.draggableProps}
    >
      <motion.div
        className={`kanban-card ${snapshot?.isDragging ? 'is-dragging' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        variants={cardVariants}
        whileHover={snapshot?.isDragging ? undefined : { y: -2 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="kanban-card-top">
          <span className={`priority-chip ${priorityClass}`}>
            <PriorityIcon size={12} aria-hidden="true" />
            {priorityText}
          </span>
          <span
            className="kanban-avatar"
            style={{ background: getAvatarColor(assigneeName || '') }}
            title={assigneeName || 'Unassigned'}
            aria-label={`Assigned to ${assigneeName || 'Unassigned'}`}
          >
            {assigneeInitials || '?'}
          </span>
        </div>

        <h3 className="kanban-task-title">{task?.title || 'Untitled task'}</h3>

        {description && <p className="kanban-card-description">{description}</p>}

        <div className="kanban-card-divider" />

        <div className="kanban-card-footer">
          <span
            className={
              isOverdue
                ? 'kanban-due is-overdue'
                : isDueSoon
                  ? 'kanban-due is-due-soon'
                  : 'kanban-due'
            }
          >
            <CalendarClock size={13} aria-hidden="true" />
            {dueDate || 'No due date'}
          </span>
          <span
            className="kanban-avatar kanban-avatar-sm"
            style={{ background: getAvatarColor(assigneeName || '') }}
            title={assigneeName || 'Unassigned'}
          >
            {assigneeInitials || '?'}
          </span>
        </div>
      </motion.div>
    </article>
  )
}

export default TaskCard