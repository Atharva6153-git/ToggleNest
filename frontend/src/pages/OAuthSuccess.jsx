import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'

function OAuthSuccess() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const completeSignIn = async () => {
      // Social sign-in now completes through /auth/firebase-login, which sets
      // an httpOnly session cookie. Never accept a bearer token from the URL.
      const user = await refreshUser()
      if (cancelled) return

      if (!user) {
        setError('OAuth login failed. Please sign in again.')
        return
      }

      navigate(user.profileComplete === false ? '/complete-profile' : '/dashboard', {
        replace: true,
      })
    }

    completeSignIn()

    return () => {
      cancelled = true
    }
  }, [navigate, refreshUser])

  if (error) {
    return (
      <PageTransition>
        <div className="auth-page">
          <div className="auth-card auth-login">
            <h1>OAuth login failed</h1>
            <p className="auth-subtitle">{error}</p>
            <Link className="primary-btn auth-submit" to="/login">
              Back to Sign in
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="auth-page">
        <div className="auth-card auth-login">
          <h1>Signing you in</h1>
          <p className="auth-subtitle">Completing your Google sign-in...</p>
        </div>
      </div>
    </PageTransition>
  )
}

export default OAuthSuccess
