import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { Check } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import SocialAuthButtons from '../components/SocialAuthButtons'
import { register, login } from '../api/authApi'

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
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

  const shakeCard = () => {
    cardControls.start({
      x: [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.3, ease: 'easeInOut' },
    })
  }

  const goNext = () => {
    setDirection(1)
    setError('')
    setStep(2)
  }

  const goBack = () => {
    setDirection(-1)
    setError('')
    setStep(1)
  }

  const handleContinue = (e) => {
    e.preventDefault()
    setError('')

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim() || !emailValid) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    goNext()
  }

  const getErrorMessage = (err) => {
    if (err?.response?.data?.message) return err.response.data.message
    const errors = err?.response?.data?.errors
    if (Array.isArray(errors) && errors.length) {
      return errors
        .map((e) => e?.msg || e?.message)
        .filter(Boolean)
        .join(' ')
    }
    if (err?.response) return `Request failed with status ${err.response.status}.`
    return 'Cannot reach the server. Check that the backend is running, then try again.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await register({ name, email, password })
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      console.log('[signup] Create Account request failed', {
        url: err?.config?.url,
        method: err?.config?.method?.toUpperCase(),
        sentBody: err?.config?.data,
        status: err?.response?.status,
        responseBody: err?.response?.data,
        networkError: !err?.response,
        axiosMessage: err?.message,
      })
      setError(getErrorMessage(err))
      shakeCard()
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

          <div className="auth-steps">
            <div className={`auth-step ${step === 2 ? 'completed' : 'active'}`}>
              <span className="auth-step-dot">
                {step === 2 ? <Check size={15} strokeWidth={3} /> : '1'}
              </span>
              <span className="auth-step-label">Account</span>
            </div>
            <div className={`auth-steps-line ${step === 2 ? 'is-active' : ''}`} />
            <div className={`auth-step ${step === 2 ? 'active' : ''}`}>
              <span className="auth-step-dot">2</span>
              <span className="auth-step-label">Confirm</span>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={step === 1 ? handleContinue : handleSubmit} noValidate>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {step === 1 ? (
                <motion.div
                  key="account"
                  className="auth-wizard-step"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <SocialAuthButtons />

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
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                  >
                    Continue
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  className="auth-wizard-step"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div>
                    <p className="auth-step-note">Review your details before creating your account.</p>

                    <div className="auth-summary">
                      <div className="auth-summary-row">
                        <span className="auth-summary-label">Name</span>
                        <span className="auth-summary-value">{name}</span>
                      </div>
                      <div className="auth-summary-row">
                        <span className="auth-summary-label">Email</span>
                        <span className="auth-summary-value">{email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="auth-step-actions">
                    <motion.button
                      className="primary-btn"
                      type="submit"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </motion.button>
                    <button
                      type="button"
                      className="auth-back-btn"
                      onClick={goBack}
                      disabled={isSubmitting}
                    >
                      Back to edit details
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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