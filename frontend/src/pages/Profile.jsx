import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Eye,
  EyeOff,
  Folder,
  KeyRound,
} from 'lucide-react'
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
import { getDashboardSummary } from '../api/dashboardApi'
import { getProjects } from '../api/projectApi'

const getInitials = (name) => (name || 'U').charAt(0).toUpperCase()

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function Profile() {
  const { refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    projects: 0,
    openTasks: 0,
    completed: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userIdCopied, setUserIdCopied] = useState(false)

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
        const [user, summary, projects] = await Promise.all([
          getProfile(),
          getDashboardSummary(),
          getProjects(),
        ])

        setProfile(user)
        setName(user.name || '')
        setJobTitle(user.jobTitle || '')
        setBio(user.bio || '')

        setStats({
          projects: Array.isArray(projects) ? projects.length : 0,
          openTasks:
            (summary?.tasksByStatus?.['To-Do'] ?? 0) +
            (summary?.tasksByStatus?.['In Progress'] ?? 0),
          completed: summary?.tasksByStatus?.Done ?? 0,
          overdue: summary?.overdueTasks ?? 0,
        })
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

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty.')
      return
    }

    setSaving(true)
    try {
      const data = await updateProfile({
        name: name.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
      })
      const updated = data?.user || data
      setProfile((prev) => ({ ...prev, ...updated }))
      setName(updated.name || name)
      setJobTitle(updated.jobTitle || '')
      setBio(updated.bio || '')
      refreshUser()
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUserId = async () => {
    const id = profile?._id || profile?.id
    if (!id) return

    try {
      await navigator.clipboard.writeText(id)
      setUserIdCopied(true)
      toast.success('User ID copied to clipboard.')
      setTimeout(() => setUserIdCopied(false), 2000)
    } catch {
      toast.error('Could not copy user ID.')
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

  const userId = profile?._id || profile?.id || ''

  const statItems = [
    { label: 'Projects', value: stats.projects, icon: Folder, variant: 'accent' },
    { label: 'Open Tasks', value: stats.openTasks, icon: ClipboardList, variant: 'default' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, variant: 'success' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, variant: 'danger' },
  ]

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
            <div className="profile-layout">
              <div className="profile-col">
                <div className="profile-card">
                  <div className="profile-loading">
                    <SkeletonCard variant="ring" />
                  </div>
                </div>
                <SkeletonCard variant="stat" />
              </div>
              <div className="profile-col">
                <SkeletonCard variant="stat" />
                <SkeletonCard variant="stat" />
              </div>
            </div>
          ) : error ? (
            <p className="empty-state">{error}</p>
          ) : (
            <motion.div
              className="profile-layout"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <div className="profile-col">
                <motion.div variants={fadeItem} className="profile-card profile-hero-card">
                  <div className="profile-banner" aria-hidden="true" />

                  <div className="profile-hero-body">
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

                    <h2 className="profile-name">{profile?.name}</h2>
                    {profile?.jobTitle && (
                      <p className="profile-job-title">{profile.jobTitle}</p>
                    )}
                    <p className="profile-email">{profile?.email}</p>
                    {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

                    <div className="profile-badge-row">
                      <span className="profile-active-badge">Active Member</span>
                    </div>
                    <p className="profile-joined">Joined {memberSince}</p>
                  </div>
                </motion.div>

                <motion.div variants={fadeItem} className="profile-card">
                  <h2 className="profile-card-title">Account Credentials</h2>

                  <div className="profile-cred-row">
                    <div>
                      <p className="profile-cred-label">Email Status</p>
                      <span className="profile-verified-badge">
                        <BadgeCheck size={14} aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="profile-cred-row">
                    <div className="profile-cred-id">
                      <p className="profile-cred-label">User ID</p>
                      <span className="profile-id-value">{userId}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-copy-btn"
                      onClick={handleCopyUserId}
                      aria-label={userIdCopied ? 'Copied' : 'Copy user ID'}
                      title="Copy user ID"
                    >
                      {userIdCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </motion.div>
              </div>

              <div className="profile-col">
                <motion.div variants={fadeItem} className="profile-card">
                  <div className="profile-activity-head">
                    <h2 className="profile-card-title">Workspace Activity</h2>
                    <span className="profile-count-badge">
                      <Folder size={13} aria-hidden="true" />
                      {stats.projects} {stats.projects === 1 ? 'project' : 'projects'}
                    </span>
                  </div>

                  <div className="profile-stats-grid">
                    {statItems.map(({ label, value, icon: Icon, variant }) => (
                      <div className={`profile-stat profile-stat-${variant}`} key={label}>
                        <div className="profile-stat-head">
                          <span className="profile-stat-icon">
                            <Icon size={14} aria-hidden="true" />
                          </span>
                          <small>{label}</small>
                        </div>
                        <p className="profile-stat-value">{value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={fadeItem} className="profile-card">
                  <h2 className="profile-card-title">Edit Personal Details</h2>

                  <form className="profile-form" onSubmit={handleSaveProfile}>
                    <div className="profile-field">
                      <label htmlFor="profile-name">Full Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="profile-field">
                      <label htmlFor="profile-job-title">
                        Job Title / Specialization
                      </label>
                      <input
                        id="profile-job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Frontend Developer"
                        maxLength={100}
                      />
                    </div>

                    <div className="profile-field">
                      <div className="profile-field-head">
                        <label htmlFor="profile-bio">Bio / About Me</label>
                        <span className="profile-char-count">{bio.length}/250</span>
                      </div>
                      <textarea
                        id="profile-bio"
                        className="profile-textarea"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a little about yourself..."
                        maxLength={250}
                        rows={4}
                      />
                    </div>

                    <div className="profile-field">
                      <label>Profile Photo</label>
                      <div className="profile-photo-row">
                        <div className="profile-photo-thumb">
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
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </div>

                    <button
                      type="submit"
                      className="primary-btn profile-save-btn"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </motion.div>

                <motion.div variants={fadeItem} className="profile-card profile-password-card">
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
                        <label htmlFor="profile-new-password">New Password</label>
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
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}

export default Profile