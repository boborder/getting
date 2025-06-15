import type { Route } from './+types/portfolio'

import { atom, useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { Xaman } from '~/components/xrp'
import { Alert } from '~/components/ui/Alert'
import { StatItem, StatsContainer } from '~/components/ui/Stats'
import { useUser } from '~/utils/xumm'

interface PortfolioItem {
  symbol: string
  amount: number
  value: number
  change24h: number
}

const portfolioAtom = atom<PortfolioItem[]>([
  { symbol: 'XRP', amount: 1000, value: 500, change24h: 2.5 },
  { symbol: 'BTC', amount: 0.01, value: 400, change24h: -1.2 },
  { symbol: 'ETH', amount: 0.2, value: 600, change24h: 3.8 },
])

const usePortfolio = () => {
  const [portfolio] = useAtom(portfolioAtom)
  return portfolio
}

export async function loader({ context }: Route.LoaderArgs) {
  return { message: 'portfolio' }
}

export default function Portfolio({ loaderData }: Route.ComponentProps) {
  const { user } = useUser()
  useHydrateAtoms([
    [
      portfolioAtom,
      [
        { symbol: 'XRP', amount: 1000, value: 500, change24h: 2.5 },
        { symbol: 'BTC', amount: 0.01, value: 400, change24h: -1.2 },
        { symbol: 'ETH', amount: 0.2, value: 600, change24h: 3.8 },
      ],
    ],
  ])
  const portfolio = usePortfolio()

  const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0)
  const totalChange = portfolio.reduce((sum, item) => sum + (item.value * item.change24h) / 100, 0)
  const changePercent = (totalChange / totalValue) * 100

  return (
    <>
      <div className='card bg-base-200 shadow-lg'>
        <div className='card-body'>
          <h1 className='card-title text-2xl'>📊 ポートフォリオ</h1>

          {!user && (
            <>
              <Alert variant='warning' title='認証が必要です'>
                XUMMでログインしてポートフォリオを管理しましょう
              </Alert>
              <Xaman />
            </>
          )}

          <StatsContainer>
            <StatItem title='総資産' value={`$${totalValue.toLocaleString()}`} description='USD' variant='primary' />
            <StatItem
              title='24h変動'
              value={`${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`}
              description={`$${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}`}
              variant={changePercent > 0 ? 'primary' : 'error'}
            />
            <StatItem title='保有銘柄' value={portfolio.length} description='通貨' variant='accent' />
          </StatsContainer>

          <div className='overflow-x-auto'>
            <table className='table table-zebra'>
              <thead>
                <tr>
                  <th>通貨</th>
                  <th>保有量</th>
                  <th>評価額</th>
                  <th>24h変動</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item) => (
                  <tr key={item.symbol}>
                    <td className='font-bold'>{item.symbol}</td>
                    <td>{item.amount.toLocaleString()}</td>
                    <td>${item.value.toLocaleString()}</td>
                    <td className={`font-bold ${item.change24h > 0 ? 'text-success' : 'text-error'}`}>
                      {item.change24h > 0 ? '+' : ''}
                      {item.change24h}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
