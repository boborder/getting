import type { ReactNode } from 'react'

export interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: ReactNode
  icon?: ReactNode
}

/**
 * 汎用アラートコンポーネント
 * 任意のメッセージ表示に使用可能
 */
export const Alert = ({ variant, title, children, icon }: AlertProps) => {
  const variantClasses = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    info: 'alert-info',
  }

  const defaultIcons = {
    success: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    ),
    warning: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z'
      />
    ),
    error: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    ),
    info: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    ),
  }

  return (
    <div className={`alert ${variantClasses[variant]} shadow-lg max-w-none`}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='stroke-current shrink-0 h-4 w-4 sm:h-6 sm:w-6'
        fill='none'
        viewBox='0 0 24 24'
      >
        {icon || defaultIcons[variant]}
      </svg>
      <div className='flex-1 min-w-0'>
        {title && <h3 className='font-bold text-sm sm:text-base break-words'>{title}</h3>}
        <div className='text-xs sm:text-sm break-words'>{children}</div>
      </div>
    </div>
  )
}
