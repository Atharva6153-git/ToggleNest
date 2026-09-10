import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { register, login } from '../api/authApi'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
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
      await register({ name, email, password })
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
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
          <h1>Create an account</h1>
          <p className="auth-subtitle">Start organizing your work today.</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
              <label htmlFor="register-name">Name</label>
            </div>

            <div className="form-group">
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <label htmlFor="register-email">Email</label>
            </div>

            <div className="form-group">
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
              <label htmlFor="register-password">Password</label>
            </div>

            <motion.button
              className="primary-btn"
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              {isSubmitting ? 'Creating account...' : 'Register'}
            </motion.button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default Register