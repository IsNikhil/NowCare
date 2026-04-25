import type { ReactNode } from 'react'

type Tab = {
  id: string
  label: string
  content: ReactNode
}

type TabsProps = {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div>
      <div className="flex gap-1 glass-1 rounded-2xl p-1 mb-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
              activeId === tab.id
                ? 'bg-white text-ink-800 shadow-sm'
                : 'text-slate-500 hover:text-ink-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          hidden={activeId !== tab.id}
          aria-hidden={activeId !== tab.id}
        >
          {activeId === tab.id && tab.content}
        </div>
      ))}
    </div>
  )
}
