import { useEffect, useRef, useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import SkeletonCard from '../components/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile, uploadProfilePicture } from '../api/authApi'

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
          )}
        </div>
        <Toaster position="top-right" />
      </PageTransition>
    </Layout>
  )
}

export default Profile