import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import UnderlineHero from '../components/UnderlineHero'

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

const stepListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const stepCardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const steps = [
  {
    number: '01',
    title: 'Create a project',
    text: 'Set up a new project with a name, description, and deadline.',
  },
  {
    number: '02',
    title: 'Assign tasks & roles',
    text: 'Break work into tasks, assign team members, and set roles for access control.',
  },
  {
    number: '03',
    title: 'Track progress on the board',
    text: 'Move tasks across the Kanban board and watch progress update in real time.',
  },
]

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
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return

    const scrollToSection = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const timer = window.setTimeout(scrollToSection, 100)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  return (
    <div className="landing-page">
      <UnderlineHero />

      <section className="landing-section landing-how" id="about">
        <div className="landing-how-head">
          <motion.h2
            className="landing-section-heading"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            How it works
          </motion.h2>

          <motion.p
            className="landing-how-subtitle"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            From idea to done, in three simple steps.
          </motion.p>
        </div>

        <motion.div
          className="landing-steps"
          variants={stepListVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          {steps.map((step) => (
            <motion.div key={step.number} className="landing-step" variants={stepCardVariants}>
              <span className="landing-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="landing-section" id="features">
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