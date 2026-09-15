import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ChevronDown, ChevronUp, Eye, EyeOff, KeyRound } from 'lucide-react'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import SkeletonCard from '../components/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from '../api/authApi'

const getInitials = (name) => (name || 'U').charAt(0).toUpperCase()

function Profile() {
  const { refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
        setName(data.name || '')
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)
      const data = await uploadProfilePicture(formData)
      setProfile((prev) => ({ ...prev, profilePicture: data.profilePicture }))
      refreshUser()
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not upload the picture.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty.')
      return
    }

    setSaving(true)
    try {
      await updateProfile({ name: name.trim() })
      setProfile((prev) => ({ ...prev, name: name.trim() }))
      refreshUser()
      toast.success('Name updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      })
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <Layout>
      <PageTransition>
        <div className="page-container">
          <div className="page-header">
            <div className="page-title">
              <h1>Profile</h1>
              <p>Manage your personal information.</p>
            </div>
          </div>

          {loading ? (
            <div className="profile-card">
              <div className="profile-loading">
                <SkeletonCard variant="ring" />
              </div>
            </div>
          ) : error ? (
            <p className="empty-state">{error}</p>
          ) : (
            <>
              <div className="profile-card">
                <div className="profile-avatar">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="profile-avatar-img"
                    />
                  ) : (
                    <span className="profile-avatar-initials">
                      {getInitials(profile?.name)}
                    </span>
                  )}
                </div>

              <button
                  type="button"
                  className="profile-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <form className="profile-form" onSubmit={handleSaveName}>
                  <div className="profile-field">
                    <label htmlFor="profile-name">Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                    />
                    <small className="profile-readonly-note">Email cannot be changed</small>
                  </div>

                  <div className="profile-field">
                    <label>Role</label>
                    <span
                      className={`role-badge role-badge-${profile?.role === 'admin' ? 'admin' : 'member'}`}
                    >
                      {profile?.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>

                  <div className="profile-field">
                    <label>Member since</label>
                    <p className="profile-member-since">{memberSince}</p>
                  </div>

                  <button
                    type="submit"
                    className="primary-btn profile-save-btn"
                    disabled={saving || name.trim() === (profile?.name || '')}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              <div className="profile-card profile-password-card">
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => setShowPasswordSection((s) => !s)}
                  aria-expanded={showPasswordSection}
                >
                  <span className="profile-password-toggle-left">
                    <KeyRound size={18} aria-hidden="true" />
                    <span>Change Password</span>
                  </span>
                  {showPasswordSection ? (
                    <ChevronUp size={18} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={18} aria-hidden="true" />
                  )}
                </button>

                {showPasswordSection && (
                  <form className="profile-form" onSubmit={handlePasswordSubmit}>
                    <div className="profile-field">
                      <label htmlFor="profile-current-password">
                        Current Password
                      </label>
                      <div className="profile-password-input">
                        <input
                          id="profile-current-password"
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowCurrent((s) => !s)}
                          aria-label={showCurrent ? 'Hide password' : 'Show password'}
                        >
                          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="profile-new-password">
                        New Password
                      </label>
                      <div className="profile-password-input">
                        <input
                          id="profile-new-password"
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowNew((s) => !s)}
                          aria-label={showNew ? 'Hide password' : 'Show password'}
                        >
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="profile-confirm-password">
                        Confirm New Password
                      </label>
                      <div className="profile-password-input">
                        <input
                          id="profile-confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowConfirm((s) => !s)}
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="primary-btn profile-save-btn"
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}

export default Profile