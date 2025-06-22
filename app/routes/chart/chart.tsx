import { NavLink, Outlet, useParams } from 'react-router'
import { TradingView } from '~/.client/Tradingview'

export default function Chart() {
  const { symbol } = useParams()

  return (
    <>
      <nav className='mx-1 p-1.5 flex gap-2 bg-neutral/30 rounded-xl overflow-x-scroll justify-center-safe'>
        <NavLink
          to='/chart/XRPUSDT'
          className={`btn btn-sm btn-outline ${symbol === 'XRPUSDT' ? 'bg-primary/30' : ''}`}
        >
          XRP/USDT
        </NavLink>
        <NavLink to='/chart/XRPJPY' className={`btn btn-sm btn-outline ${symbol === 'XRPJPY' ? 'bg-primary/30' : ''}`}>
          XRP/JPY
        </NavLink>
        <NavLink to='/chart/USDJPY' className={`btn btn-sm btn-outline ${symbol === 'USDJPY' ? 'bg-primary/30' : ''}`}>
          USD/JPY
        </NavLink>
        <NavLink
          to='/chart/BTCUSDT'
          className={`btn btn-sm btn-outline ${symbol === 'BTCUSDT' ? 'bg-primary/30' : ''}`}
        >
          BTC/USDT
        </NavLink>
        <NavLink
          to='/chart/ETHUSDT'
          className={`btn btn-sm btn-outline ${symbol === 'ETHUSDT' ? 'bg-primary/30' : ''}`}
        >
          ETH/USDT
        </NavLink>
        <NavLink to='/chart/XAHUSD' className={`btn btn-sm btn-outline ${symbol === 'XAHUSD' ? 'bg-primary/30' : ''}`}>
          XAH/USD
        </NavLink>
        <NavLink
          to='/chart/FLRUSDT'
          className={`btn btn-sm btn-outline ${symbol === 'FLRUSDT' ? 'bg-primary/30' : ''}`}
        >
          FLR/USDT
        </NavLink>
        <NavLink
          to='/chart/XDCUSDT'
          className={`btn btn-sm btn-outline ${symbol === 'XDCUSDT' ? 'bg-primary/30' : ''}`}
        >
          XDC/USDT
        </NavLink>
      </nav>
      <TradingView />
      <Outlet />
    </>
  )
}
