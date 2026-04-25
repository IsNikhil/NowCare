type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'slate' | 'violet'

type BadgeProps = {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-tint)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  success: 'bg-green-500/10 text-green-600 border border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  teal: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
  slate: 'bg-slate-100/60 text-slate-500 border border-slate-200/50',
  violet: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
  teal: 'bg-teal-500',
  slate: 'bg-slate-400',
  violet: 'bg-violet-500',
}

export function Badge({ variant = 'default', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  )
}
