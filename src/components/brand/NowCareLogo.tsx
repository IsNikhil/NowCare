type NowCareLogoProps = {
  size?: number
  showWordmark?: boolean
  className?: string
  wordmarkClassName?: string
}

export function NowCareLogo({
  size = 32,
  showWordmark = true,
  className = '',
  wordmarkClassName = 'text-[var(--text-primary)]',
}: NowCareLogoProps) {
  const radius = Math.max(8, size * 0.31)

  return (
    <div className={['inline-flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #0D9488 0%, #20D3B6 52%, #7C3AED 100%)',
          boxShadow: '0 8px 22px -8px rgba(13,148,136,.85), inset 0 1px 0 rgba(255,255,255,.38)',
        }}
        aria-hidden
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13 41.5C21.5 39.2 23.5 24 32 24C40.5 24 42.5 39.2 51 41.5" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="12.5" fill="rgba(3,22,23,.82)" />
          <path d="M32 23.5V40.5M23.5 32H40.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <circle cx="13" cy="41.5" r="4.5" fill="white" />
          <circle cx="51" cy="41.5" r="4.5" fill="white" />
        </svg>
      </div>
      {showWordmark && (
        <span className={['font-extrabold tracking-tight', wordmarkClassName].filter(Boolean).join(' ')}>
          NowCare
        </span>
      )}
    </div>
  )
}
