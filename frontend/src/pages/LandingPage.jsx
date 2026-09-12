import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

const heroWords = ['Organize', 'your', 'work,', 'ship', 'together.']

const navVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

const ctaButtonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 1.05, ease: 'easeOut' } },
}

const featureListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const featureCardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
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
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 16))

  return (
    <div className="landing-page">
      <motion.header
        className={scrolled ? 'landing-nav scrolled' : 'landing-nav'}
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
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
      </motion.header>

      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="landing-blob landing-blob-1" />
          <div className="landing-blob landing-blob-2" />
          <div className="landing-blob landing-blob-3" />
        </div>
        <div className="landing-noise" aria-hidden="true" />

        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <motion.p
              className="landing-badge"
              initial={{ opacity: 0, y: 14 }}
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
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="landing-sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.85, ease: 'easeOut' }}
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
                  variants={ctaButtonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.1, ease: 'easeOut' } }}
                >
                  Get Started
                </motion.button>
              </div>

              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 1.15, ease: 'easeOut' }}
              >
                <Link to="/login" className="landing-login-link">
                  Log in
                </Link>
              </motion.span>
            </div>
          </div>
        </div>

        <div className="landing-divider" aria-hidden="true" />
      </section>

      <section className="landing-section">
        <motion.h2
          className="landing-section-heading"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          Built for the way teams actually work
        </motion.h2>

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
              whileHover={{ y: -6, boxShadow: '0 22px 45px rgba(0, 0, 0, 0.5)' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
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