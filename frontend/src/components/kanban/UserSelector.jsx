import { useEffect, useState } from 'react'
import { getUsers } from '../../api/authApi'

function UserSelector({ value, onChange, label = 'Assignee' }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      try {
        const data = await getUsers()
        if (isMounted) {
          setUsers(data)
        }
      } catch {
        if (isMounted) {
          setUsers([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <label className="kanban-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Unassigned</option>
        {!loading &&
          users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
      </select>
    </label>
  )
}

export default UserSelector