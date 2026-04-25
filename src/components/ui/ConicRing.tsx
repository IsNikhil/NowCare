export function ConicRing({
  size = 64,
  color = 'var(--accent-teal)',
  className,
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <div
      className={`conic-ring shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${color} 0deg, transparent 120deg, transparent 360deg)`,
        opacity: 0.25,
      }}
      aria-hidden
    />
  )
}
