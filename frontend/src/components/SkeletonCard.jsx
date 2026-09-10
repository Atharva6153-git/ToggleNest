function SkeletonCard({ variant = 'card', className = '' }) {
  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`.trim()}
      aria-hidden="true"
    >
      {variant === 'stat' && (
        <>
          <span className="skeleton-bar skeleton-bar-label" />
          <span className="skeleton-bar skeleton-bar-value" />
        </>
      )}

      {variant === 'task' && (
        <>
          <span className="skeleton-bar skeleton-bar-title" />
          <span className="skeleton-bar skeleton-bar-meta" />
          <span className="skeleton-bar skeleton-bar-meta skeleton-bar-meta-short" />
        </>
      )}
    </div>
  )
}

export default SkeletonCard