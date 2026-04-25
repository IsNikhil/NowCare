import { Drawer } from 'vaul'
import { X } from 'lucide-react'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[]
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[24px] max-h-[90dvh]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderBottom: 'none',
          }}
        >
          <div className="flex-shrink-0 flex items-center justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--border-subtle)' }}
            />
          </div>
          {title && (
            <div className="flex items-center justify-between px-5 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-tint)] transition-colors"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
