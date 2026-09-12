import { motion, useScroll, useSpring } from 'framer-motion'

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div className="scroll-progress-track" aria-hidden="true">
      <motion.div className="scroll-progress-fill" style={{ scaleX }} />
    </div>
  )
}

export default ScrollProgressBar