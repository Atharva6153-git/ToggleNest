import { useEffect, useState } from 'react'
import { getUsers } from '../api/authApi'
import SkeletonCard from './SkeletonCard'

function ProjectMemberPicker({ value = [], onChange }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      try {
        const data = await getUsers()
        if (mounted) setUsers(data)
      } catch {
        if (mounted) setUsers([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUsers()
    return () => {
      mounted = false
    }
  }, [])

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    onChange(next)
  }

  return (
    <div className="form-group">
      <label>Team Members</label>
      {loading ? (
        <SkeletonCard variant="card" className="member-picker-skeleton" />
      ) : users.length ? (
        <div className="member-picker">
          {users.map((user) => (
            <label
              key={user._id}
              className={`member-chip${value.includes(user._id) ? ' selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={value.includes(user._id)}
                onChange={() => toggle(user._id)}
              />
              <span>{user.name}</span>
              <small>{user.role}</small>
            </label>
          ))}
        </div>
      ) : (
        <p className="form-hint">No users available yet.</p>
      )}
    </div>
  )
}

export default ProjectMemberPicker