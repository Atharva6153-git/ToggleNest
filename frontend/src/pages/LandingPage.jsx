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
  return (
    <div className="landing-page">
      <UnderlineHero />

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