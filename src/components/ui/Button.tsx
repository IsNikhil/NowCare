import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary text-white',
  secondary: 'btn-secondary',
  ghost: 'bg-transparent hover:bg-[var(--surface-tint)] text-[var(--text-primary)]',
  danger: 'bg-gradient-to-r from-rose-500 to-coral-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm min-h-[36px] rounded-xl',
  md: 'px-5 py-2.5 text-sm min-h-[40px] rounded-xl',
  lg: 'px-7 py-3 text-base min-h-[48px] rounded-xl',
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
        'btn-base',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:transform-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />}
      {children}
    </button>
  )
}
