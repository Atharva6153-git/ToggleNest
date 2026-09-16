import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { ArrowRight, Calendar, Trash2, Users } from 'lucide-react'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import SkeletonCard from '../components/SkeletonCard'
import ProjectDiscussion from '../components/kanban/ProjectDiscussion'
import ProjectMemberPicker from '../components/ProjectMemberPicker'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { getProject, updateProject, deleteProject } from '../api/projectApi'
import { getDashboardSummary } from '../api/dashboardApi'
import { getActivityLogs } from '../api/activityApi'

const AVATAR_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4']

function getInitials(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColor(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatRelative(timestamp) {
  const date = new Date(timestamp)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function TeamAvatar({ user: member }) {
  if (member?.profilePicture) {
    return (
      <img
        className="team-avatar team-avatar-img"
        src={member.profilePicture}
        alt={member.name}
      />
    )
  }

  return (
    <span
      className="team-avatar"
      style={{ background: getAvatarColor(member?.name) }}
      aria-hidden="true"
    >
      {getInitials(member?.name)}
    </span>
  )
}

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [project, setProject] = useState(null)
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [manageOpen, setManageOpen] = useState(false)
  const [memberIds, setMemberIds] = useState([])
  const [savingMembers, setSavingMembers] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true

    const load = async () => {
      try {
        const [projectData, summaryData, logsData] = await Promise.all([
          getProject(id),
          getDashboardSummary({ project: id }),
          getActivityLogs({ project: id }),
        ])
        if (!isMounted) return
        setProject(projectData)
        setSummary(summaryData)
        setLogs(Array.isArray(logsData) ? logsData : [])
      } catch (err) {
        if (!isMounted) return
        setError(err?.response?.data?.message || 'Failed to load the project.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [id])

  const done = summary?.tasksByStatus?.Done ?? 0
  const total = summary?.totalTasks ?? 0
  const completion = summary?.completionPercentage ?? 0
  const isCompleted = total > 0 && done === total

  const ownerId = String(project?.createdBy?._id || project?.createdBy || '')
  const isOwner = String(user?.id) === ownerId
  const members = project?.members || []
  const uniqueMembers = isOwner
    ? members.filter((m) => String(m._id || m) !== ownerId)
    : members
  const memberCount = uniqueMembers.length + (isOwner ? 1 : 0)

  const formattedDeadline = project?.deadline
    ? new Date(project.deadline).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No deadline'

  const openManage = () => {
    setMemberIds(members.map((m) => String(m._id || m)))
    setManageOpen(true)
  }

  const handleSaveMembers = async () => {
    setSavingMembers(true)
    try {
      await updateProject(id, { members: memberIds })
      toast.success('Team updated')
      const fresh = await getProject(id)
      setProject(fresh)
      setManageOpen(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update team.')
    } finally {
      setSavingMembers(false)
    }
  }

  const handleDeleteProject = async () => {
    setDeleting(true)
    try {
      await deleteProject(id)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete project.')
    } finally {
      setDeleting(false)
    }
  }

  const progressStats = [
    { label: 'To-Do', value: summary?.tasksByStatus?.['To-Do'] ?? 0 },
    { label: 'In Progress', value: summary?.tasksByStatus?.['In Progress'] ?? 0 },
    { label: 'Done', value: done },
    { label: 'Total Tasks', value: total, accent: true },
  ]

  return (
    <Layout>
      <PageTransition>
        <div className="page-container">
          {loading ? (
            <div className="project-detail">
              <div className="page-header">
                <SkeletonCard variant="card" />
              </div>
              <div className="project-detail-grid">
                <SkeletonCard variant="card" />
                <div className="project-detail-sidebar">
                  <SkeletonCard variant="card" />
                  <SkeletonCard variant="card" />
                </div>
              </div>
            </div>
          ) : error ? (
            <p className="empty-state">{error}</p>
          ) : (
            <motion.div
              className="project-detail"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* ---- Top section ---- */}
              <motion.header variants={fadeItem} className="project-detail-header">
                <div className="project-detail-heading">
                  <div className="project-detail-title-row">
                    <h1 className="project-detail-title">{project.name}</h1>
                    <span className={`project-badge ${isCompleted ? 'project-badge-done' : 'project-badge-active'}`}>
                      {isCompleted ? 'Completed' : 'Active'}
                    </span>
                    <span className="project-viewer-badge">
                      {isOwner ? 'Owner' : 'Member'}
                    </span>
                  </div>

                  {project.description && (
                    <p className="project-detail-description">{project.description}</p>
                  )}

                  <div className="project-detail-meta">
                    <span className="project-meta-item">
                      <Calendar size={14} aria-hidden="true" />
                      Due {formattedDeadline}
                    </span>
                    <span className="project-meta-item">
                      <Users size={14} aria-hidden="true" />
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                <div className="project-detail-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => navigate(`/projects/${id}/board`)}
                  >
                    Go to Board
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={openManage}
                      >
                        Manage Team
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate(`/projects/edit/${id}`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn-outline"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.header>

              {/* ---- Two-column grid ---- */}
              <div className="project-detail-grid">
                {/* Left column */}
                <div className="project-detail-main">
                  <motion.section variants={fadeItem} className="project-card-block">
                    <header className="project-card-block-header">
                      <h2 className="project-card-block-title">Task Progress</h2>
                      <span className="project-completion-badge">{completion}%</span>
                    </header>

                    <div className="project-progress-track">
                      <div
                        className="project-progress-fill"
                        style={{ width: `${completion}%` }}
                      />
                    </div>

                    <div className="project-stats-row">
                      {progressStats.map(({ label, value, accent }) => (
                        <div
                          className={`project-stat${accent ? ' project-stat-accent' : ''}`}
                          key={label}
                        >
                          <small>{label}</small>
                          <p className="project-stat-value">{value}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="project-detail-link"
                      onClick={() => navigate(`/projects/${id}/board`)}
                    >
                      View detailed task board
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </motion.section>

                  <motion.div variants={fadeItem}>
                    <ProjectDiscussion projectId={id} />
                  </motion.div>
                </div>

                {/* Right column */}
                <aside className="project-detail-sidebar">
                  <motion.section variants={fadeItem} className="project-card-block">
                    <header className="project-card-block-header">
                      <h2 className="project-card-block-title">Team Members</h2>
                      {isAdmin && (
                        <button
                          type="button"
                          className="project-card-block-action"
                          onClick={openManage}
                        >
                          Manage members
                        </button>
                      )}
                    </header>

                    <ul className="team-list">
                      <li className="team-item">
                        <TeamAvatar user={project.createdBy} />
                        <div className="team-info">
                          <span className="team-name">{project.createdBy?.name || 'Unknown'}</span>
                          <span className="team-email">{project.createdBy?.email}</span>
                        </div>
                        <span className="team-role team-role-owner">Owner</span>
                      </li>

                      {uniqueMembers.map((m) => (
                        <li className="team-item" key={m._id}>
                          <TeamAvatar user={m} />
                          <div className="team-info">
                            <span className="team-name">{m.name || 'Unknown'}</span>
                            <span className="team-email">{m.email}</span>
                          </div>
                          <span className="team-role">Member</span>
                        </li>
                      ))}

                      {uniqueMembers.length === 0 && (
                        <li className="team-empty">No additional members.</li>
                      )}
                    </ul>
                  </motion.section>

                  <motion.section variants={fadeItem} className="project-card-block">
                    <h2 className="project-card-block-title">Recent Activity</h2>

                    {logs.length === 0 ? (
                      <p className="activity-empty">No recent activity yet.</p>
                    ) : (
                      <ul className="activity-timeline">
                        {logs.map((log) => (
                          <li className="activity-item" key={log._id}>
                            <span className="activity-dot">
                              {log.performedBy?.profilePicture ? (
                                <img
                                  className="activity-dot-img"
                                  src={log.performedBy.profilePicture}
                                  alt=""
                                />
                              ) : (
                                <span
                                  className="activity-dot-initials"
                                  style={{ background: getAvatarColor(log.performedBy?.name) }}
                                  aria-hidden="true"
                                >
                                  {getInitials(log.performedBy?.name)}
                                </span>
                              )}
                            </span>
                            <div className="activity-body">
                              <p className="activity-text">
                                <strong>{log.performedBy?.name || 'Someone'}</strong>{' '}
                                {log.action}
                              </p>
                              {log.task?.title && (
                                <p className="activity-sub">{log.task.title}</p>
                              )}
                              <span className="activity-time">
                                {formatRelative(log.timestamp)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.section>
                </aside>
              </div>

              {/* ---- Modals ---- */}
              <ConfirmModal
                isOpen={deleteOpen}
                title="Delete Project"
                message="Are you sure you want to delete this project? All tasks, comments and activity will be removed. This action cannot be undone."
                isSubmitting={deleting}
                onConfirm={handleDeleteProject}
                onCancel={() => setDeleteOpen(false)}
              />

              {manageOpen && (
                <motion.div
                  className="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={savingMembers ? undefined : () => setManageOpen(false)}
                >
                  <motion.div
                    className="modal-panel"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="modal-header">
                      <h2>Manage Team</h2>
                      <button
                        type="button"
                        className="close-button"
                        onClick={() => setManageOpen(false)}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </div>

                    <ProjectMemberPicker value={memberIds} onChange={setMemberIds} />

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setManageOpen(false)}
                        disabled={savingMembers}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={handleSaveMembers}
                        disabled={savingMembers}
                      >
                        {savingMembers ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}

export default ProjectDetail