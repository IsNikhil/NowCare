import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  imageUrl?: string
}

export function EmptyState({ icon, title, description, action, imageUrl }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4">
      {imageUrl && (
        <img
          src={`${imageUrl}?w=200&q=80&auto=format&fit=crop`}
          alt=""
          className="w-32 h-32 object-cover rounded-2xl opacity-70 mb-2"
        />
      )}
      {icon && !imageUrl && (
        <div className="text-slate-300 mb-2">{icon}</div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-ink-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
