import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { login } from '../api/authApi'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
          className="auth-card auth-login"
          initial={{ opacity: 0, y: 20 }}
          animate={cardControls}
        >
          <h1>Sign in to ToggleNest</h1>
          <p className="auth-subtitle">Organize your work, one board at a time.</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-email">
                Email
              </label>
              <div className="auth-input">
                <Mail className="auth-input-icon" size={16} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label className="auth-field-label" htmlFor="login-password">
                  Password
                </label>
                <a
                  className="auth-forgot"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>
              <div className="auth-input auth-input-password">
                <Lock className="auth-input-icon" size={16} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              className="primary-btn auth-submit"
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>

          <p className="auth-terms">
            By logging in, you agree to our Terms of Service &amp; Privacy Policy.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default Login