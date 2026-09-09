import { useEffect, useRef, useState, useCallback } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notificationApi'
import { TOKEN_KEY } from '../api/axiosInstance'

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

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const containerRef = useRef(null)

  const extractNotifications = useCallback((res) => {
    if (!res) return []
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    try {
      const res = await getNotifications({ limit: 30 })
      console.log('NotificationBell raw response:', res)
      const items = extractNotifications(res)
      setNotifications(items)
      setUnreadCount(res?.unreadCount || 0)
      setError('')
    } catch (err) {
      console.error('NotificationBell fetch error:', err)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [extractNotifications])

  const refreshUnreadCount = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    try {
      const res = await getNotifications({ limit: 1 })
      setUnreadCount(res?.unreadCount || 0)
      setNotifications((prev) => {
        const items = extractNotifications(res)
        return items.length > 0 && items.length !== prev.length ? items : prev
      })
    } catch {
      // ignore polling errors for the badge count
    }
  }, [extractNotifications])

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(refreshUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, refreshUnreadCount, token])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen) {
      setLoading(true)
      fetchNotifications()
    }
  }

  const handleMarkAsRead = async (id) => {
    const current = notifications.find((n) => n._id === id)
    if (!current || current.isRead) return

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((count) => Math.max(0, count - 1))

    try {
      await markAsRead(id)
    } catch {
      fetchNotifications()
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await markAllAsRead()
    } catch {
      fetchNotifications()
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        className="notification-btn"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span className="notification-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : error ? (
              <div className="notification-empty notification-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  className={`notification-item${n.isRead ? '' : ' unread'}`}
                  onClick={() => handleMarkAsRead(n._id)}
                >
                  <span className="notification-message">{n.message}</span>
                  <span className="notification-time">{formatTime(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
