import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  side?: boolean
  responsiveSide?: boolean
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
  background?: 'base-100' | 'base-200' | 'base-300'
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

interface CardActionsProps {
  children: ReactNode
  className?: string
  justify?: 'start' | 'center' | 'end' | 'between'
}

export function Card({
  children,
  className = '',
  size = 'md',
  side = false,
  responsiveSide = false,
  shadow = 'lg',
  background = 'base-100',
}: CardProps) {
  const sizeClass = size !== 'md' ? `card-${size}` : ''
  const sideClass = side ? 'card-side' : ''
  const responsiveSideClass = responsiveSide ? 'lg:card-side' : ''
  const shadowClass = `shadow-${shadow}`
  const bgClass = `bg-${background}`

  return (
    <div
      className={`card max-w-none ${sizeClass} ${sideClass} ${responsiveSideClass} ${bgClass} ${shadowClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`card-body p-2 ${className}`.trim()}>{children}</div>
}

export function CardTitle({ children, className = '', size = 'md' }: CardTitleProps) {
  const sizeClasses = {
    sm: 'text-sm sm:text-base break-words',
    md: 'text-base sm:text-lg break-words',
    lg: 'text-lg sm:text-xl lg:text-2xl break-words',
    xl: 'text-xl sm:text-2xl lg:text-3xl break-words',
  }

  return <h2 className={`card-title ${sizeClasses[size]} ${className}`.trim()}>{children}</h2>
}

export function CardActions({ children, className = '', justify = 'end' }: CardActionsProps) {
  const justifyClass = `justify-${justify}`

  return <div className={`card-actions flex-col sm:flex-row gap-2 ${justifyClass} ${className}`.trim()}>{children}</div>
}
