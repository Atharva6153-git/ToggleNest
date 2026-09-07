import { mockUsers } from '../../data/mockUsers'

function UserSelector({ value, onChange, label = 'Assignee' }) {
  return (
    <label className="kanban-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Unassigned</option>
        {mockUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </label>
  )
}

export default UserSelector
