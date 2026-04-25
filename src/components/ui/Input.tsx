import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
  error?: string
  icon?: ReactNode
}

export function Input({
  label,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full h-11 rounded-2xl px-4 text-sm text-ink-800 placeholder:text-slate-400',
            'bg-white/70 backdrop-blur-md',
            'border transition-all duration-150',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
              : 'border-white/60 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15',
            'outline-none',
            icon ? 'pl-10' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
    </div>
  )
}
