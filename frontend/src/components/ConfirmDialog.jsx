import { motion, AnimatePresence } from 'framer-motion'

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          onClick={isSubmitting ? undefined : onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="modal-panel confirm-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="modal-header">
              <h2>{title}</h2>
              <button
                type="button"
                className="close-button"
                onClick={onCancel}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="confirm-modal-message">{message}</p>

            <div className="modal-actions confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={onConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDialog