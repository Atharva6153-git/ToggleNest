import { useEffect, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RadialBackground } from './RadialBackground'
import ThemeToggleButton from './ThemeToggleButton'

const cn = (...inputs) => inputs.filter(Boolean).join(' ')

const buttonVariants = cva('nl-btn', {
  variants: {
    variant: {
      default: 'nl-btn-default',
      outline: 'nl-btn-outline',
      ghost: 'nl-btn-ghost',
    },
    size: {
      default: 'nl-btn-md',
      sm: 'nl-btn-sm',
      lg: 'nl-btn-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const Button = ({ className, variant, size, onClick, ref, ...props }) => {
  const localRef = useRef(null)

  const mergeRefs = (node) => {
    localRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const handleClick = (e) => {
    const btn = localRef.current
    if (!btn) return

    btn.classList.add('btn-bounce-anim')
    window.setTimeout(() => btn.classList.remove('btn-bounce-anim'), 300)

    if (onClick) onClick(e)
  }

  const classes = cn(buttonVariants({ variant, size }), className ?? '')
  return <button ref={mergeRefs} onClick={handleClick} className={classes} {...props} />
}
Button.displayName = 'Button'

const navItems = [
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
]

const Navigation = ({ brand = 'ToggleNest', onSignIn }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [menuOpen])

  useEffect(() => {
    const handleDocMouseDown = (e) => {
      if (!menuOpen) return
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen && triggerRef.current) triggerRef.current.focus()
  }, [menuOpen])

  return (
    <motion.nav
      className={cn('nl-nav', scrolled && 'nl-nav-scrolled')}
      aria-label="Main navigation"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="nl-nav-inner">
        <div className="nl-nav-row">
          <div className="nl-nav-brand">
            <a href="/" className="nl-brand-link">
              {brand}
            </a>
          </div>

          <div className="nl-nav-desktop">
            <div className="nl-nav-links-group">
              {navItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="nl-nav-link nl-focus-outline">
                  {item.label}
                </a>
              ))}

              <ThemeToggleButton />

              <Button
                size="sm"
                variant="default"
                className="nl-nav-signin"
                onClick={() => onSignIn?.()}
              >
                Sign In
              </Button>
            </div>
          </div>

          <div className="nl-nav-mobile">
            <ThemeToggleButton />

            <Button
              size="sm"
              variant="ghost"
              className="nl-focus-outline"
              onClick={() => setMenuOpen((s) => !s)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="menu"
              ref={triggerRef}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </Button>

            {menuOpen && (
              <div
                id="mobile-menu"
                ref={menuRef}
                className="nl-mobile-menu"
                role="menu"
                aria-label="Mobile menu"
              >
                <div className="nl-mobile-menu-list">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="nl-mobile-menu-link nl-focus-outline"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      {item.label}
                    </a>
                  ))}

                  <div className="nl-mobile-menu-actions">
                    <Button
                      size="sm"
                      variant="default"
                      className="nl-w-full"
                      onClick={() => {
                        setMenuOpen(false)
                        onSignIn?.()
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

const Hero = ({ heroClassName, onTryForFree }) => {
  return (
    <section className="nl-hero" aria-labelledby="hero-heading">
      <RadialBackground />
      <div className="nl-hero-inner">
        <h1 id="hero-heading" className="nl-hero-title nl-anim">
          Organize Your Work, Ship
          <br />
          <span className="nl-hero-word-wrap">
            <span className={cn(heroClassName ?? '', 'nl-hero-word')}>Together</span>
            <svg
              className="nl-hero-underline"
              viewBox="0 0 170 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 9C32.8203 5.34032 108.769 -0.881146 166 3.51047"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
            </svg>
          </span>
        </h1>

        <div className="nl-hero-desc-wrap nl-anim nl-anim-delay-1">
          <p className="nl-hero-desc">
            ToggleNest brings kanban boards, role-based access, and real-time collaboration into
            one calm workspace.
          </p>
        </div>

        <div className="nl-anim nl-anim-delay-2">
          <Button
            size="lg"
            variant="default"
            className="nl-hero-cta"
            onClick={() => onTryForFree?.()}
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  )
}

const UnderlineHero = ({ brand = 'ToggleNest', heroClassName, onSignIn, onTryForFree }) => {
  const navigate = useNavigate()
  const handleSignIn = onSignIn ?? (() => navigate('/login'))
  const handleTryForFree = onTryForFree ?? (() => navigate('/signup'))

  return (
    <div className="nl-underline-hero">
      <Navigation brand={brand} onSignIn={handleSignIn} />
      <Hero heroClassName={heroClassName} onTryForFree={handleTryForFree} />
    </div>
  )
}

export default UnderlineHero