import type { HTMLAttributes } from 'react'

type CardLevel = 1 | 2 | 3
type Padding = 'sm' | 'md' | 'lg' | 'none'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  level?: CardLevel
  padding?: Padding
}

const levelClasses: Record<CardLevel, string> = {
  1: 'glass-1',
  2: 'glass-2',
  3: 'glass-3',
}

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
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
        'rounded-2xl',
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
