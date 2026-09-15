import { useEffect, useState } from 'react'
import { getUsers } from '../api/authApi'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']
const STATUS_OPTIONS = ['To-Do', 'In Progress', 'Done']

function FiltersBar({
  searchValue,
  onSearchChange,
  priorityValue,
  onPriorityChange,
  statusValue,
  onStatusChange,
  assignedToValue,
  onAssignedToChange,
  onClear,
  searchPlaceholder = 'Search...',
}) {
  const [users, setUsers] = useState([])

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
      }
    }

    if (onAssignedToChange) {
      loadUsers()
    }

    return () => {
      isMounted = false
    }
  }, [onAssignedToChange])

  const hasActiveFilters =
    searchValue !== '' ||
    Boolean(priorityValue) ||
    Boolean(statusValue) ||
    Boolean(assignedToValue)

  return (
    <div className="filters-bar">
      <div className="filters-search">
        <span className="filters-search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          className="filters-search-input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search"
        />
      </div>

      {onPriorityChange && (
        <select
          className="filters-select"
          value={priorityValue || ''}
          onChange={(event) => onPriorityChange(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      )}

      {onStatusChange && (
        <select
          className="filters-select"
          value={statusValue || ''}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      )}

      {onAssignedToChange && (
        <select
          className="filters-select"
          value={assignedToValue || ''}
          onChange={(event) => onAssignedToChange(event.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="">All assignees</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="filters-clear-btn"
        disabled={!hasActiveFilters}
        onClick={onClear}
      >
        Clear filters
      </button>
    </div>
  )
}

export default FiltersBar