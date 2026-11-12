import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { UsersRound } from 'lucide-react'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import SkeletonCard from '../components/SkeletonCard'
import { getUsers, updateUserRole } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const getInitials = (name) =>
  (name || 'User')
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

const formatJoinedDate = (date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString()
}

function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingRoleChange, setPendingRoleChange] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load users.')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const requestRoleChange = (selectedUser, role) => {
    if (role === selectedUser.role) return
    setPendingRoleChange({ user: selectedUser, role })
  }

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return

    setSaving(true)
    try {
      const updatedUser = await updateUserRole(
        pendingRoleChange.user._id,
        pendingRoleChange.role
      )
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser._id === updatedUser._id
            ? { ...currentUser, ...updatedUser }
            : currentUser
        )
      )
      toast.success(`${updatedUser.name}'s role updated successfully.`)
      setPendingRoleChange(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the user role.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className="page-container">
          <div className="page-header">
            <div className="page-title">
              <h1>Manage Users</h1>
              <p>Update workspace roles and access.</p>
            </div>
          </div>

          {loading ? (
            <div className="admin-users-skeleton-grid" aria-label="Loading users">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} variant="card" />
              ))}
            </div>
          ) : error ? (
            <p className="empty-state">{error}</p>
          ) : users.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              heading="No users found"
              description="There are no users to manage yet."
            />
          ) : (
            <div className="admin-users-card">
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Role</th>
                      <th scope="col">Joined</th>
                      <th scope="col">Change role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((listedUser) => {
                      const isCurrentUser = String(listedUser._id) === String(user?.id)

                      return (
                        <tr key={listedUser._id}>
                          <td>
                            <div className="admin-user-identity">
                              {listedUser.profilePicture ? (
                                <img
                                  src={listedUser.profilePicture}
                                  alt=""
                                  className="admin-user-avatar"
                                />
                              ) : (
                                <span className="admin-user-avatar admin-user-initials">
                                  {getInitials(listedUser.name)}
                                </span>
                              )}
                              <div>
                                <strong>{listedUser.name}</strong>
                                <span>{listedUser.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`role-badge role-badge-${listedUser.role}`}
                            >
                              {listedUser.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="admin-user-joined">
                            {formatJoinedDate(listedUser.createdAt)}
                          </td>
                          <td>
                            <select
                              className="admin-user-role-select"
                              value={listedUser.role}
                              onChange={(event) =>
                                requestRoleChange(listedUser, event.target.value)
                              }
                              disabled={isCurrentUser || saving}
                              aria-label={`Change role for ${listedUser.name}`}
                              title={
                                isCurrentUser
                                  ? 'You cannot change your own role'
                                  : undefined
                              }
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                            {isCurrentUser && (
                              <small className="admin-user-self-note">Your account</small>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      <ConfirmDialog
        isOpen={Boolean(pendingRoleChange)}
        title="Change user role"
        message={
          pendingRoleChange
            ? `Change ${pendingRoleChange.user.name}'s role to ${
                pendingRoleChange.role === 'admin' ? 'Admin' : 'Member'
              }?`
            : ''
        }
        confirmLabel="Change role"
        submittingLabel="Changing..."
        isSubmitting={saving}
        onConfirm={confirmRoleChange}
        onCancel={() => {
          if (!saving) setPendingRoleChange(null)
        }}
      />
    </Layout>
  )
}

export default AdminUsers
