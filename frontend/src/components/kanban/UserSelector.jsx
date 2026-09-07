import { useEffect, useState } from 'react'
import { getUsers } from '../../api/userApi'

function UserSelector({ value, onChange, label = 'Assignee' }) {
  const [users, setUsers] = useState([])

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])

  return (
    <label className="kanban-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </label>
  )
}

export default UserSelector