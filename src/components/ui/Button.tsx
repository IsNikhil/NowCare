import type { ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40',
  secondary: 'glass-1 text-ink-800 hover:shadow-md',
  ghost: 'bg-transparent text-ink-800 hover:glass-1',
  danger:
    'bg-gradient-to-r from-rose-500 to-coral-500 text-white shadow-lg shadow-rose-500/30',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm min-h-[36px]',
  md: 'px-6 py-2.5 text-sm min-h-[44px]',
  lg: 'px-8 py-3 text-base min-h-[52px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold rounded-full',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}
