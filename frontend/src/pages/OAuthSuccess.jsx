import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import axiosInstance, { TOKEN_KEY } from '../api/axiosInstance'
import PageTransition from '../components/PageTransition'

function OAuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('OAuth login failed. No token was returned.')
      return
    }

    localStorage.setItem(TOKEN_KEY, token)

    try {
      const decoded = jwtDecode(token)
      localStorage.setItem(
        'user',
        JSON.stringify({ id: decoded.userId, role: decoded.role }),
      )
    } catch {
      // ignore malformed token; profile fetch below fills in user info
    }

    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/auth/profile')
        const u = res.data.data.user
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: u._id ?? u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          }),
        )
      } catch {
        // token is still valid; redirect anyway
      }
      navigate('/dashboard', { replace: true })
    }

    fetchProfile()
  }, [navigate, searchParams])

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