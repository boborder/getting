import { useParams } from 'react-router'
import { AdvancedRealTimeChart, CryptoCurrencyMarket, MiniChart } from 'react-ts-tradingview-widgets'
import { ClientOnly } from 'remix-utils/client-only'
import { getTheme } from '~/components/layout/Theme'

export const TradingView = () => {
  const theme = getTheme()
  const { symbol } = useParams()
  const currentSymbol = symbol || 'XRPUSDT' // デフォルト値

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => (
        <div className='h-[64vh] md:h-[75vh] mb-8'>
          <AdvancedRealTimeChart
            autosize
            theme={theme}
            symbol={currentSymbol}
            interval='D'
            range='YTD'
            hide_top_toolbar
            hide_side_toolbar
            // hide_legend
            // style='1'
          />
        </div>
      )}
    </ClientOnly>
  )
}

export const MarketCap = () => {
  const theme = getTheme()
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => (
        <div className='h-60 mb-8'>
          <CryptoCurrencyMarket autosize colorTheme={theme} />
        </div>
      )}
    </ClientOnly>
  )
}

export const Graph = () => {
  const theme = getTheme()
  const { symbol } = useParams()
  const currentSymbol = symbol || 'XRPUSDT' // デフォルト値

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => (
        <div className='h-60 mb-8'>
          <MiniChart autosize symbol={currentSymbol} colorTheme={theme} />
        </div>
      )}
    </ClientOnly>
  )
}
