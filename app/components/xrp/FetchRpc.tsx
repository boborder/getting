import useSWR from 'swr'
import { Client } from 'xrpl'
import { fee, getBalance, xrpPrice } from '~/utils/dig'
import { useUser } from '~/utils/xumm'

// ===== Fetchコンポーネント（元のFetch.tsxのUIを完璧に保持） =====

export const Fetch = () => {
  const { xumm, user } = useUser()
  const ws: string = user?.networkEndpoint || 'wss://xrplcluster.com'

  // client もキャッシュを利用する？
  const { data: client } = useSWR(ws ? ws : null, (ws: string) => new Client(ws))

  const { data: feeData } = useSWR(client ? 'fee' : null, fee, {
    refreshInterval: 3333,
  })
  const { data: xrpUSD } = useSWR('dex', async () => await xrpPrice(), {
    refreshInterval: 15000,
  })
  const { data: balanceData } = useSWR(user ? 'balance' : null, async () => await getBalance(user?.account!), {
    refreshInterval: 60000,
  })

  const fetchRates = async (currency: string) => await xumm?.helpers?.getRates(currency)
  const { data: priceJPY } = useSWR(user ? 'JPY' : null, fetchRates, { refreshInterval: 60000 })
  const { data: priceUSD } = useSWR(user ? 'USD' : null, fetchRates, { refreshInterval: 60000 })

  return (
    <>
      <div className='responsive'>
        <div className='stat'>
          <div className='stat-title'>LedgerIndex</div>
          <div className='stat-value'>
            <span className='font-mono text-3xl'>{feeData?.result?.ledger_current_index || '---'}</span>
          </div>
          <div className='stat-figure'>
            <img src='/assets/xrpl.png' width={78} height={78} alt='xrp' />
            fee: {feeData?.result?.drops?.open_ledger_fee || '10'}
          </div>
          <div className='stat-desc text-accent'>{ws}</div>
        </div>

        <div className='stat'>
          <div className='stat-title'>BookOffers</div>
          <div className='stat-value'>
            <span className='font-mono text-3xl'>${xrpUSD?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className='stat-desc text-accent'>DEX PRICE XRP/USD</div>
        </div>
      </div>

      {user?.account && (
        <div className='responsive'>
          <div className='stat'>
            <div className='stat-title'>XRP Price</div>
            <div className='stat-value flex flex-col-reverse gap-2'>
              <span className='font-mono text-3xl'>JPY ¥{priceJPY?.XRP?.toFixed(2) || '0.00'}</span>
              <span className='font-mono text-3xl'>USD ${priceUSD?.XRP?.toFixed(4) || '0.0000'}</span>
            </div>
          </div>

          <div className='stat'>
            <div className='stat-title'>Balance</div>
            <div className='stat-value font-mono text-3xl'>
              <span className='font-mono text-3xl'>{balanceData || '0'}</span>
            </div>
            <div className='stat-desc text-xl'>XRP</div>
            <div className='stat-desc text-xs font-bold text-accent'>{user?.account}</div>
          </div>
        </div>
      )}
    </>
  )
}
