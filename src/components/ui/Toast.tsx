import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToastContext } from '../../context/ToastContext'
import type { Toast as ToastType, ToastType as TType } from '../../context/ToastContext'

const iconMap: Record<TType, React.ReactNode> = {
  success: <CheckCircle2 size={18} strokeWidth={1.75} className="text-emerald-500" />,
  error: <AlertCircle size={18} strokeWidth={1.75} className="text-rose-500" />,
  info: <Info size={18} strokeWidth={1.75} className="text-teal-500" />,
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToastContext()

  return (
    <div className="glass-2 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg animate-fade-up min-w-[280px] max-w-sm">
      <span className="mt-0.5 shrink-0">{iconMap[toast.type]}</span>
      <p className="text-sm text-ink-800 font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastContext()

  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  )
}
