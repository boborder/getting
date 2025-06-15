import { Outlet } from 'react-router'
import { MarketCap } from '~/.client/Tradingview'

export default function Market() {
  return (
    <>
      <MarketCap />
      <Outlet />
    </>
  )
}
