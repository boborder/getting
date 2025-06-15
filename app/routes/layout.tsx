import { Outlet, useNavigation } from 'react-router'
import { Accept } from '~/components/layout/Accept'
import { Loading } from '~/components/ui/Loading'

export default function Layout() {
  // 遷移中
  const { location } = useNavigation()
  return (
    <>
      {location && <Loading />}
      <div className='min-h-[75vh] mx-1 border-2 border-primary rounded-box'>
        <div className='min-h-[64vh] p-1 grid place-content-center place-items-center text-center'>
          <Outlet />
        </div>
        <Accept />
      </div>
    </>
  )
}
