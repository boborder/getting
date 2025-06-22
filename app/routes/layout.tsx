import { Outlet, useNavigation } from 'react-router'
import { Accept } from '~/components/layout/Accept'
import { Loading } from '~/components/ui/Loading'

export default function Layout() {
  // 遷移中
  const { location } = useNavigation()
  return (
    <>
      {location && <Loading />}
      <div className='min-h-[75vh] border-2 border-primary rounded-box'>
        <div className='min-h-[64vh] grid place-content-center place-items-center text-center'>
          <Accept />
          <Outlet />
        </div>
      </div>
    </>
  )
}
