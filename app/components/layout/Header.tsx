import { NavLink } from 'react-router'
import { Network } from '~/components/xrp'
import { Menu } from './Menu'
import { SideDrawerButton } from './Sidebar'
import { Theme } from './Theme'

export const Header = () => {
  return (
    <header className='navbar absolute z-10 bg-base-200 lg:pl-52'>
      <div className='navbar-start gap-1'>
        <SideDrawerButton />
        <NavLink to='/' className='btn btn-ghost px-0.5'>
          {/* <img src='/assets/avatar.png' alt='logo' className='h-8 w-8' /> */}
          <h1 className='font-bold'>みんな〜やってるか！</h1>
        </NavLink>
      </div>

      <div className='navbar-center'>
        <Network />
      </div>

      <div className='navbar-end gap-1'>
        <Theme />
        <Menu />
      </div>
    </header>
  )
}
