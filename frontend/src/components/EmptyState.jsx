import { motion } from 'framer-motion'

function EmptyState({
  icon: Icon,
  heading,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <motion.div
      className={`empty-state-block${compact ? ' empty-state-block-compact' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {Icon && (
        <span className="empty-state-block-icon">
          <Icon size={compact ? 16 : 26} />
        </span>
      )}

      {heading && <h3 className="empty-state-block-heading">{heading}</h3>}

      {description && (
        <p className="empty-state-block-desc">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          className="primary-btn empty-state-block-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}

export default EmptyState