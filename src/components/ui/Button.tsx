import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonOwnProps = {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

type ButtonProps =
  | (ButtonHTMLAttributes<HTMLButtonElement> & ButtonOwnProps & { as?: 'button' })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & ButtonOwnProps & { as: 'a' })

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
  as = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'btn-base',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:transform-none',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (as === 'a') {
    const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a className={classes} {...anchorProps}>
        {loading && <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />}
        {children}
      </a>
    )
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>
  const disabled = buttonProps.disabled
  return (
    <button
      disabled={disabled || loading}
      className={classes}
      {...buttonProps}
    >
      {loading && <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />}
      {children}
    </button>
  )
}
