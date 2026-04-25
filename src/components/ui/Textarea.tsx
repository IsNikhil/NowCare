import { useEffect, useRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helperText?: string
  autoResize?: boolean
  maxChars?: number
  currentLength?: number
}

export function Textarea({
  label,
  error,
  helperText,
  autoResize = false,
  maxChars,
  currentLength,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  useEffect(() => {
    if (!autoResize || !ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [autoResize, props.value])

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={[
          'w-full rounded-2xl px-4 py-3 text-sm text-ink-800 placeholder:text-slate-400',
          'bg-white/70 backdrop-blur-md resize-none',
          'border transition-all duration-150',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
            : 'border-white/60 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15',
          'outline-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      <div className="flex justify-between items-start">
        <div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
        </div>
        {maxChars !== undefined && currentLength !== undefined && (
          <p className={`text-xs ml-auto ${currentLength > maxChars ? 'text-rose-500' : 'text-slate-400'}`}>
            {currentLength}/{maxChars}
          </p>
        )}
      </div>
    </div>
  )
}
