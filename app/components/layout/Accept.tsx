import { useStore } from '~/utils/useStore'

export const Accept = () => {
  const [accept, setAccept] = useStore({
    key: 'accept',
    init: false,
    store: {
      onGet: () => JSON.parse(localStorage.getItem('accept') || 'false'),
      onSet: (key, data) => localStorage.setItem(key as string, JSON.stringify(data)),
    },
  })
  const [alert, setAlert] = useStore({
    key: 'alert',
    init: true,
    store: {
      onGet: () => JSON.parse(sessionStorage.getItem('alert') || 'true'),
      onSet: (key, data) => sessionStorage.setItem(key as string, JSON.stringify(data)),
    },
  })

  return (
    !accept &&
    alert && (
      <div role='alert' className='alert'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          className='stroke-current h-4 w-4 sm:h-6 sm:w-6 shrink-0'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <div className='flex-1 min-w-0'>
          <span className='text-xs sm:text-sm break-words'>🍪 このサイトでは、クッキーを使用しています。</span>
        </div>
        <div className='flex flex-row gap-1 md:gap-2 shrink-0'>
          <button className='btn btn-xs md:btn-sm btn-outline w-auto' onMouseDown={() => setAlert(false)}>
            拒否
          </button>
          <button className='btn btn-xs md:btn-sm btn-primary w-auto' onMouseDown={() => setAccept(true)}>
            同意
          </button>
        </div>
      </div>
    )
  )
}
