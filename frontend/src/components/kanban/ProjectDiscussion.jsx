import { useEffect, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getComments, createComment, deleteComment } from '../../api/commentApi'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../ConfirmModal'

const AVATAR_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4']

function getInitials(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return '?'

  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColor(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function CommentAvatar({ author }) {
  const name = author?.name || ''
  const picture = author?.profilePicture

  if (picture) {
    return (
      <img
        className="discussion-avatar discussion-avatar-img"
        src={picture}
        alt={name}
      />
    )
  }

  return (
    <span
      className="discussion-avatar"
      style={{ background: getAvatarColor(name) }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  )
}

function ProjectDiscussion({ projectId }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!projectId) {
      setComments([])
      setError('')
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchComments = async () => {
      try {
        const data = await getComments(projectId)
        if (isMounted) {
          setComments(Array.isArray(data) ? data : [])
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load comments.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchComments()

    return () => {
      isMounted = false
    }
  }, [projectId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!projectId || !trimmed) return

    setIsSubmitting(true)

    try {
      const created = await createComment(projectId, trimmed)
      setComments((current) => [...current, created])
      setText('')
      toast.success('Comment posted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not post the comment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!commentToDelete?._id) return

    setIsDeleting(true)

    try {
      await deleteComment(commentToDelete._id)
      setComments((current) => current.filter((c) => c._id !== commentToDelete._id))
      setCommentToDelete(null)
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the comment.')
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete = (comment) =>
    isAdmin || String(comment?.author?._id) === String(user?.id)

  return (
    <section className="discussion-card" aria-label="Project Discussion">
      <header className="discussion-header">
        <h2 className="discussion-title">Project Discussion</h2>
        {comments.length > 0 && (
          <span className="discussion-count">{comments.length}</span>
        )}
      </header>

      {!projectId ? (
        <p className="discussion-state">
          Select a project to view its discussion.
        </p>
      ) : loading ? (
        <p className="discussion-state">Loading comments...</p>
      ) : error ? (
        <p className="discussion-state discussion-state-error">{error}</p>
      ) : comments.length === 0 ? (
        <p className="discussion-state">No comments yet. Start the discussion below.</p>
      ) : (
        <ul className="discussion-list">
          {comments.map((comment) => {
            const authorName = comment?.author?.name || 'Unknown'

            return (
              <li className="discussion-item" key={comment._id}>
                <CommentAvatar author={comment.author} />

                <div className="discussion-item-body">
                  <div className="discussion-item-meta">
                    <span className="discussion-author">{authorName}</span>
                    <span className="discussion-timestamp">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="discussion-text">{comment.text}</p>
                </div>

                {canDelete(comment) && (
                  <button
                    type="button"
                    className="discussion-delete-btn"
                    aria-label="Delete comment"
                    title="Delete comment"
                    onClick={() => setCommentToDelete(comment)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {projectId && (
        <form className="discussion-form" onSubmit={handleSubmit}>
        <textarea
          className="discussion-input"
          placeholder="Write a comment..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          maxLength={1000}
          aria-label="New comment"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="discussion-send-btn"
          disabled={isSubmitting || !text.trim()}
        >
          <Send size={15} aria-hidden="true" />
          {isSubmitting ? 'Posting...' : 'Send'}
        </button>
      </form>
      )}

      <ConfirmModal
        isOpen={Boolean(commentToDelete)}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setCommentToDelete(null)}
      />
    </section>
  )
}

export default ProjectDiscussion