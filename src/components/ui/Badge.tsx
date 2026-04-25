type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'slate'

type BadgeProps = {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-600',
  info: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-500',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
