type SkeletonProps = {
  className?: string
  height?: number | string
  width?: number | string
  rounded?: string
}

export function Skeleton({ className = '', height, width, rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ height, width }}
      aria-hidden
    />
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton height={14} className={className} />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton height={20} width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '40%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton height={size} width={size} rounded="rounded-full" />
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '65%' : '100%'} />
      ))}
    </div>
  )
}
