import { lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const Spline = lazy(() => import('@splinetool/react-spline'))

const SPLINE_SCENE = 'https://prod.spline.design/o3cDynVxT4Qh3GdB/scene.splinecode'

const heroWords = ['Organize', 'your', 'work,', 'ship', 'together.']

const featureListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const featureCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const features = [
  {
    icon: '🗂️',
    title: 'Kanban boards',
    text: 'Drag-and-drop boards that keep every task moving from To-Do to Done.',
  },
  {
    icon: '🔐',
    title: 'Role-based access',
    text: 'Control who can view and manage projects with clear roles and permissions.',
  },
  {
    icon: '⚡',
    title: 'Real-time collaboration',
    text: 'Shared workspaces with instant notification alerts keep the whole team in sync.',
  },
]

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <span className="landing-brand">
          Toggle<span>Nest</span>
        </span>
        <nav className="landing-nav-actions">
          <Link to="/login" className="landing-nav-link">
            Sign in
          </Link>
          <Link to="/signup" className="landing-nav-cta">
            Get Started
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <motion.p
              className="landing-badge"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              ✦ Team task &amp; workflow management
            </motion.p>

            <h1 className="landing-title">
              {heroWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="landing-word"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="landing-sub"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7, ease: 'easeOut' }}
            >
              ToggleNest is a team task and workflow management tool — organize projects on
              Kanban boards, control access with roles, and keep your whole team aligned in
              one place.
            </motion.p>

            <div className="landing-cta">
              <div className="landing-cta-button">
                <div className="landing-glow" aria-hidden="true" />
                <motion.button
                  className="landing-get-started"
                  type="button"
                  onClick={() => navigate('/signup')}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.9, ease: 'easeOut' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Get Started
                </motion.button>
              </div>

              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1, ease: 'easeOut' }}
              >
                <Link to="/login" className="landing-login-link">
                  Log in
                </Link>
              </motion.span>
            </div>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <Suspense fallback={<div className="spline-fallback" />}>
              <div className="landing-spline">
                <Spline scene={SPLINE_SCENE} />
              </div>
            </Suspense>
            <div className="spline-watermark-cover" />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <motion.div
          className="landing-features"
          variants={featureListVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="landing-feature"
              variants={featureCardVariants}
            >
              <span className="landing-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="landing-footer">© 2026 ToggleNest</footer>
    </div>
  )
}

export default LandingPage