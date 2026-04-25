import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
  error?: string
  icon?: ReactNode
  rightElement?: ReactNode
}

export function Input({
  label,
  helperText,
  error,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full h-11 rounded-xl px-4 text-sm placeholder:text-[var(--text-muted)]',
            'bg-[var(--bg-glass)] backdrop-blur-md',
            'border transition-all duration-150 outline-none',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
              : 'border-[var(--border-subtle)] focus:border-[var(--accent-teal)] focus:ring-2 focus:ring-[var(--accent-teal-glow)]',
            'text-[var(--text-primary)]',
            icon ? 'pl-10' : '',
            rightElement ? 'pr-12' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>}
    </div>
  )
}
