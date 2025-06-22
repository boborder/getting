import type { ReactNode } from 'react'

interface StatsContainerProps {
  children: ReactNode
  className?: string
  vertical?: boolean
  responsive?: boolean
  shadow?: boolean
}

interface StatItemProps {
  title: string
  value: string | number
  description?: string
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  className?: string
}

export function StatsContainer({
  children,
  className = '',
  vertical = false,
  responsive = true,
  shadow = true,
}: StatsContainerProps) {
  const orientationClass = vertical ? 'stats-vertical' : ''
  const responsiveClass = responsive ? 'sm:stats-horizontal' : ''
  const shadowClass = shadow ? 'shadow' : ''

  return (
    <div className={`stats max-w-none ${orientationClass} ${responsiveClass} ${shadowClass} ${className}`.trim()}>
      {children}
    </div>
  )
}

export function StatItem({ title, value, description, variant = 'default', className = '' }: StatItemProps) {
  const variantClasses = {
    default: '',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  }

  return (
    <div className={`stat min-w-0 ${className}`.trim()}>
      <div className='stat-title truncate'>{title}</div>
      <div className={`stat-value break-words hyphens-auto overflow-wrap-anywhere ${variantClasses[variant]}`.trim()}>
        {value}
      </div>
      {description && <div className='stat-desc truncate'>{description}</div>}
    </div>
  )
}
