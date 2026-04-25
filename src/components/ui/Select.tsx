import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={[
            'w-full h-11 rounded-2xl px-4 pr-10 text-sm text-ink-800 appearance-none',
            'bg-[var(--bg-glass)] text-[var(--text-primary)] backdrop-blur-md',
            'border transition-all duration-150',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
              : 'border-[var(--border-subtle)] focus:border-[var(--accent-teal)] focus:ring-2 focus:ring-[var(--accent-teal-glow)]',
            'outline-none cursor-pointer',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>}
    </div>
  )
}
