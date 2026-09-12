import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { toast, Toaster } from 'react-hot-toast'
import { auth, googleProvider, githubProvider } from '../firebase'
import { firebaseLogin } from '../api/authApi'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
)

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
)

const firebaseProviders = {
  google: googleProvider,
  github: githubProvider,
}

const providers = [
  { name: 'Google', Icon: GoogleIcon, type: 'google' },
  { name: 'Microsoft', Icon: MicrosoftIcon, type: 'placeholder' },
  { name: 'GitHub', Icon: GitHubIcon, type: 'github' },
]

function SocialAuthButtons() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)

  const signInWithFirebase = async (providerName) => {
    setLoading(providerName)
    try {
      const result = await signInWithPopup(auth, firebaseProviders[providerName])
      const idToken = await result.user.getIdToken()
      await firebaseLogin(idToken)
      toast.success(`Signed in with ${providerName}`)
      navigate('/dashboard')
    } catch (err) {
      const closed = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']
      if (closed.includes(err?.code)) {
        toast('Sign-in popup was closed.')
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account with this email already exists. Try a different sign-in method.')
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            'Could not sign in. Please try again.'
        )
      }
    } finally {
      setLoading(null)
    }
  }

  const handleClick = (item) => {
    if (item.type === 'placeholder') {
      console.log(`${item.name} OAuth not yet implemented`)
      return
    }
    signInWithFirebase(item.name.toLowerCase())
  }

  return (
    <div className="auth-social">
      <div className="auth-social-buttons">
        {providers.map((item) => (
          <motion.button
            key={item.name}
            type="button"
            className="auth-social-btn"
            onClick={() => handleClick(item)}
            disabled={loading !== null}
            whileTap={loading === null ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.1 }}
          >
            <item.Icon />
            <span>{loading === item.name.toLowerCase() ? 'Signing in...' : item.name}</span>
          </motion.button>
        ))}
      </div>
      <div className="auth-divider">
        <span>OR</span>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}

export default SocialAuthButtons