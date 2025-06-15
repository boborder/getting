import { NavLink } from 'react-router'
import { useUser } from '~/utils/xumm'

export const Nav = () => {
  const { xumm, user } = useUser()
  return (
    <nav className='m-1 p-2 flex gap-4 bg-neutral/30 text-secondary rounded-xl overflow-auto justify-center-safe'>
      <NavLink to='/' className='btn btn-sm btn-outline current-page'>
        🏠 ホーム
      </NavLink>
      <div
        className='btn btn-sm btn-outline'
        onMouseDown={async () => (user ? await xumm?.logout() : await xumm?.authorize())}
      >
        {user ? '🚪 ログアウト' : '🔐 ログイン'}
      </div>
      <NavLink to='/chart' className='btn btn-sm btn-outline current-page'>
        📊 チャート
      </NavLink>
      <NavLink to='/community' className='btn btn-sm btn-outline current-page'>
        🎯 コミュニティ
      </NavLink>
      <NavLink to='/portfolio' className='btn btn-sm btn-outline current-page'>
        💼 ポートフォリオ
      </NavLink>
      <NavLink to='/alerts' className='btn btn-sm btn-outline current-page'>
        🔔 アラート
      </NavLink>
      <NavLink to='/test' className='btn btn-sm btn-outline current-page'>
        🧪 テスト
      </NavLink>
    </nav>
  )
}
