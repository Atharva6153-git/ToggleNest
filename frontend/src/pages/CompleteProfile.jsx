import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, UserRound } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { updateProfile, uploadProfilePicture } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const getInitials = (name) => (name || 'U').charAt(0).toUpperCase()

function CompleteProfile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)
      const data = await uploadProfilePicture(formData)
      setProfilePicture(data.profilePicture)
      await refreshUser()
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not upload the picture.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!profilePicture) {
      setError('Please upload a profile picture to continue.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateProfile({
        name: name.trim(),
        jobTitle: user?.jobTitle || '',
        bio: user?.bio || '',
      })
      await refreshUser()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div
          className="auth-card auth-login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <h1>Complete your profile</h1>
          <p className="auth-subtitle">
            Add your profile picture and confirm your name to get started.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSave} noValidate>
            <div className="complete-profile-photo">
              <button
                type="button"
                className="complete-profile-avatar"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile picture"
                disabled={uploading}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="complete-profile-avatar-img" />
                ) : (
                  <span className="complete-profile-avatar-fallback">
                    {uploading ? '...' : getInitials(name)}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="complete-profile-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  'Uploading...'
                ) : profilePicture ? (
                  <>
                    <Camera size={14} aria-hidden="true" />
                    Change Photo
                  </>
                ) : (
                  <>
                    <Camera size={14} aria-hidden="true" />
                    Upload Photo
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="complete-profile-name">
                Full Name
              </label>
              <div className="auth-input">
                <UserRound className="auth-input-icon" size={16} aria-hidden="true" />
                <input
                  id="complete-profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
            </div>

            <motion.button
              className="primary-btn auth-submit"
              type="submit"
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              {saving ? 'Saving...' : 'Continue to Dashboard'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default CompleteProfile