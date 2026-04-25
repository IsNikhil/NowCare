import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ open, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const firstFocusable = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    firstFocusable.current?.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={[
          'relative my-4 max-h-[calc(100vh-2rem)] w-full overflow-y-auto glass-2 rounded-3xl p-6 shadow-2xl animate-fade-up',
          widthClasses[maxWidth],
        ].join(' ')}
      >
        <div className="flex items-start justify-between mb-5">
          <h2 id="modal-title" className="text-lg font-semibold text-ink-800 tracking-tight">
            {title}
          </h2>
          <button
            ref={firstFocusable}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-ink-800 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
