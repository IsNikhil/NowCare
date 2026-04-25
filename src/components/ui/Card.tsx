import type { HTMLAttributes } from 'react'

type CardLevel = 1 | 2 | 3
type Padding = 'sm' | 'md' | 'lg' | 'none'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  level?: CardLevel
  padding?: Padding
}

const levelClasses: Record<CardLevel, string> = {
  1: 'glass-card',
  2: 'glass-card-elevated',
  3: 'glass-card-elevated',
}

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({
  level = 1,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        levelClasses[level],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
