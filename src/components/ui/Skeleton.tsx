type SkeletonProps = {
  className?: string
}

function Shimmer({ className = '' }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100',
        'bg-[length:400%_100%]',
        'rounded-xl',
        className,
      ].join(' ')}
    />
  )
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <Shimmer className={`h-4 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="glass-1 rounded-2xl p-6 flex flex-col gap-3">
      <Shimmer className="h-5 w-3/4" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
      <div className="flex gap-2 mt-2">
        <Shimmer className="h-8 w-20 rounded-full" />
        <Shimmer className="h-8 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonAvatar({ size = 12 }: { size?: number }) {
  return <Shimmer className={`w-${size} h-${size} rounded-full`} />
}
