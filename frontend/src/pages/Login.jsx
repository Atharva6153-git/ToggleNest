import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { login } from '../api/authApi'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const cardControls = useAnimationControls()

  useEffect(() => {
    cardControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    })
  }, [cardControls])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
      cardControls.start({
        x: [0, -8, 8, -8, 8, 0],
        transition: { duration: 0.3, ease: 'easeInOut' },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={cardControls}
        >
          <h1>Welcome to ToggleNest</h1>
          <p className="auth-subtitle">Sign in to manage your projects.</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <label htmlFor="login-email">Email</label>
            </div>

            <div className="form-group">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
              <label htmlFor="login-password">Password</label>
            </div>

            <motion.button
              className="primary-btn"
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default Login