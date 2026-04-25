type Size = 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <span
      className={[
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizeMap[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="glass-2 rounded-3xl p-10 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-teal-500" />
        <p className="text-slate-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}
