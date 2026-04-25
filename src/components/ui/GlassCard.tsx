import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { ComponentPropsWithoutRef, ElementType } from 'react'

type Variant = 'default' | 'elevated' | 'interactive'

type GlassCardProps<T extends ElementType = 'div'> = {
  variant?: Variant
  as?: T
  className?: string
  children?: React.ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'variant' | 'className' | 'children'>

export function GlassCard<T extends ElementType = 'div'>({
  variant = 'default',
  as,
  className,
  children,
  ...props
}: GlassCardProps<T>) {
  const baseClass = variant === 'elevated' ? 'glass-card-elevated' : 'glass-card'
  const combined = clsx(baseClass, className)

  if (variant === 'interactive') {
    return (
      <motion.div
        className={clsx('glass-card glass-interactive cursor-pointer', className)}
        whileHover={{ y: -2, transition: { duration: 0.22 } }}
        whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </motion.div>
    )
  }

  const Tag = (as ?? 'div') as ElementType
  return (
    <Tag className={combined} {...props}>
      {children}
    </Tag>
  )
}
