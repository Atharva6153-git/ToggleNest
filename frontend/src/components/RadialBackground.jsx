const RadialBackground = ({
  background = 'radial-gradient(125% 125% at 50% 10%, var(--bg) 40%, color-mix(in srgb, var(--accent) 20%, transparent) 100%)',
  opacity = 0.9,
  ...rest
}) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        background,
        opacity,
        pointerEvents: 'none',
        ...rest,
      }}
    />
  )
}

export { RadialBackground }