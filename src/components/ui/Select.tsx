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
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={[
            'w-full h-11 rounded-2xl px-4 pr-10 text-sm text-ink-800 appearance-none',
            'bg-white/70 backdrop-blur-md',
            'border transition-all duration-150',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
              : 'border-white/60 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15',
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
    </div>
  )
}
