import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getDashboardSummary } from '../api/dashboardApi'

const Dashboard = () => {
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary()
        setSummary(data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard summary.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const statusCards = [
    { label: 'To-Do', value: summary?.tasksByStatus?.['To-Do'] ?? 0 },
    { label: 'In Progress', value: summary?.tasksByStatus?.['In Progress'] ?? 0 },
    { label: 'Done', value: summary?.tasksByStatus?.Done ?? 0 },
  ]

  const priorityCards = [
    { label: 'Low', value: summary?.tasksByPriority?.Low ?? 0 },
    { label: 'Medium', value: summary?.tasksByPriority?.Medium ?? 0 },
    { label: 'High', value: summary?.tasksByPriority?.High ?? 0 },
  ]

  const completion = summary?.completionPercentage ?? 0

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Overview of tasks across your workspace.</p>
          </div>

          <button className="create-btn" onClick={() => navigate('/')}>
            View Projects
          </button>
        </div>

        {loading ? (
          <p className="empty-state">Loading dashboard...</p>
        ) : error ? (
          <p className="empty-state">{error}</p>
        ) : (
          <>
            <div className="dashboard-total">
              <div className="stat-card stat-card-total">
                <small>Total Tasks</small>
                <p className="stat-value">{summary.totalTasks}</p>
              </div>

              <div className="dashboard-completion">
                <div className="completion-header">
                  <small>Completion</small>
                  <span className="completion-pct">{completion}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Tasks by Status</h2>
              <div className="dashboard-grid">
                {statusCards.map((card) => (
                  <div className="stat-card" key={card.label}>
                    <small>{card.label}</small>
                    <p className="stat-value">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Tasks by Priority</h2>
              <div className="dashboard-grid">
                {priorityCards.map((card) => (
                  <div
                    className={`stat-card stat-priority-${card.label.toLowerCase()}`}
                    key={card.label}
                  >
                    <small>{card.label}</small>
                    <p className="stat-value">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
