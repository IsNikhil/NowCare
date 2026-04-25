import type { ERStatus } from '../../types'

const config: Record<ERStatus, { label: string; classes: string; pulse: boolean }> = {
  low: {
    label: 'Low Wait',
    classes: 'bg-emerald-100 text-emerald-700',
    pulse: false,
  },
  moderate: {
    label: 'Moderate',
    classes: 'bg-amber-100 text-amber-700',
    pulse: false,
  },
  high: {
    label: 'High Wait',
    classes: 'bg-rose-100 text-rose-600',
    pulse: true,
  },
  closed: {
    label: 'Closed',
    classes: 'bg-slate-100 text-slate-500',
    pulse: false,
  },
}

export function StatusPill({ status }: { status: ERStatus }) {
  const { label, classes, pulse } = config[status]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        classes,
      ].join(' ')}
    >
      <span
        className={[
          'w-1.5 h-1.5 rounded-full',
          status === 'low'
            ? 'bg-emerald-500'
            : status === 'moderate'
              ? 'bg-amber-500'
              : status === 'high'
                ? 'bg-rose-500'
                : 'bg-slate-400',
          pulse ? 'animate-pulse-slow' : '',
        ].join(' ')}
      />
      {label}
    </span>
  )
}
