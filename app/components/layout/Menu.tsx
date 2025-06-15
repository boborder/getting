import { NavLink } from 'react-router'
import { useUser } from '~/utils/xumm'

export const Menu = () => {
  const { xumm, user } = useUser()
  return (
    <div className='dropdown dropdown-end dropdown-hover'>
      <button tabIndex={0} className='btn btn-square btn-ghost'>
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' className='h-9 w-9 stroke-current'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
          />
          <title>Menu</title>
        </svg>
      </button>

      <ul tabIndex={0} className='dropdown-content menu min-w-48 p-2 bg-base-100/80 rounded-box'>
        <li>
          <NavLink to='/' className='current-page'>
            <button className='btn btn-xs'>ホーム</button>
            <span className='badge'>🏠</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/chart' className='current-page'>
            <button className='btn btn-xs'>チャート</button>
            <span className='badge'>📈</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/test' className='current-page'>
            <button className='btn btn-xs'>テスト</button>
            <span className='badge'>🧪</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/portfolio' className='current-page'>
            <button className='btn btn-xs'>ポートフォリオ</button>
            <span className='badge'>💼</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/alerts' className='current-page'>
            <button className='btn btn-xs'>アラート</button>
            <span className='badge'>🔔</span>
          </NavLink>
        </li>
        <li>
          <div onMouseDown={user ? async () => await xumm?.logout() : async () => await xumm?.authorize()}>
            <button className='btn btn-xs'>{user ? 'ログアウト' : 'ログイン'}</button>
            <span className='badge'>🔑</span>
          </div>
        </li>
      </ul>
    </div>
  )
}
