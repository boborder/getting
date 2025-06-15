import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { XrplDex } from '~/components/xrp/XrplDex'
import { useUser } from '~/utils/xumm'
import type { Route } from './+types/dashboard'

// ===== Jotai Atoms =====

const dashboardPreferencesAtom = atomWithStorage('dashboard-preferences', {
  showDebugInfo: false,
  autoRefresh: true,
})

const urlParamsAtom = atom({
  tab: 'swap' as 'swap' | 'payment' | 'trustset',
  fromToken: 'XRP',
  toToken: '',
  amount: '',
  destination: '',
})

// ===== Loader =====

export async function loader({ context }: Route.LoaderArgs) {
  const { isProduction } = context
  return {
    isProduction,
  }
}

// ===== メインコンポーネント =====

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Jotai atoms
  const [preferences, setPreferences] = useAtom(dashboardPreferencesAtom)
  const [urlParams, setUrlParams] = useAtom(urlParamsAtom)

  // ユーザー情報
  const { user } = useUser()

  // URL同期
  useEffect(() => {
    const newParams = {
      tab: (searchParams.get('tab') as 'swap' | 'payment' | 'trustset') || 'swap',
      fromToken: searchParams.get('from') || 'XRP',
      toToken: searchParams.get('to') || '',
      amount: searchParams.get('amount') || '',
      destination: searchParams.get('destination') || '',
    }
    setUrlParams(newParams)
  }, [searchParams, setUrlParams])

  // ハンドラー関数
  const handleTabChange = (tab: 'swap' | 'payment' | 'trustset') => {
    const newParams = { ...urlParams, tab }
    setUrlParams(newParams)
    updateSearchParams(newParams)
  }

  const handleQuickSwap = (from: string, to: string, amt: string) => {
    const newParams = {
      ...urlParams,
      tab: 'swap' as const,
      fromToken: from,
      toToken: to,
      amount: amt,
    }
    setUrlParams(newParams)
    updateSearchParams(newParams)
  }

  const handleQuickPayment = (dest: string, _curr: string, amt: string) => {
    const newParams = {
      ...urlParams,
      tab: 'payment' as const,
      destination: dest,
      amount: amt,
    }
    setUrlParams(newParams)
    updateSearchParams(newParams)
  }

  const handleStateChange = (updates: Record<string, string>) => {
    const newParams = { ...urlParams, ...updates }
    setUrlParams(newParams)
    updateSearchParams(newParams)
  }

  const updateSearchParams = (params: typeof urlParams) => {
    const newSearchParams = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        newSearchParams.set(key, value)
      } else {
        newSearchParams.delete(key)
      }
    }
    setSearchParams(newSearchParams)
  }

  return (
    <div className='space-y-4 p-4 max-w-6xl mx-auto'>
      {/* ヘッダー */}
      <Card size='sm' background='base-200'>
        <CardBody className='p-4'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <CardTitle size='lg'>🚀 XRPL DEX Dashboard</CardTitle>
              <div className='flex flex-wrap items-center gap-2 mt-1'>
                <div className={`badge ${loaderData.isProduction ? 'badge-success' : 'badge-warning'}`}>
                  {loaderData.isProduction ? '🌐 Production' : '🧪 Development'}
                </div>
                {user?.account && <div className='badge badge-success'>🔐 XUMM認証済み</div>}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* アカウント情報 */}
      {user?.account && (
        <Card size='sm' background='base-200'>
          <CardBody className='p-4'>
            <CardTitle size='sm' className='mb-3'>
              👤 アカウント情報
            </CardTitle>
            <div className='bg-base-100 p-3 rounded-lg'>
              <div className='text-sm'>
                <div className='font-mono'>
                  {user.account.slice(0, 8)}...{user.account.slice(-8)}
                </div>
                <div className='text-xs opacity-70 mt-1'>
                  ネットワーク: {user.networkEndpoint?.includes('testnet') ? 'Testnet' : 'Mainnet'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* クイックアクション */}
      <Card size='sm' background='base-200'>
        <CardBody className='p-4'>
          <CardTitle size='sm' className='mb-3'>
            ⚡ クイックアクション
          </CardTitle>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
            <button onClick={() => handleQuickSwap('XRP', 'USD', '100')} className='btn btn-outline btn-sm'>
              🔄 XRP → USD (100)
            </button>
            <button onClick={() => handleQuickSwap('USD', 'XRP', '50')} className='btn btn-outline btn-sm'>
              🔄 USD → XRP (50)
            </button>
            <button onClick={() => handleQuickPayment('', 'XRP', '10')} className='btn btn-outline btn-sm'>
              💸 XRP送金 (10)
            </button>
          </div>
        </CardBody>
      </Card>

      {/* メインDEXコンポーネント */}
      <XrplDex
        defaultTab={urlParams.tab}
        initialValues={{
          swap: {
            fromToken: urlParams.fromToken,
            toToken: urlParams.toToken,
            amount: urlParams.amount,
          },
          payment: {
            destination: urlParams.destination,
            amount: urlParams.amount,
          },
        }}
        onTabChange={handleTabChange}
        onStateChange={handleStateChange}
      />

      {/* デバッグ情報 */}
      {!loaderData.isProduction &&
        (preferences.showDebugInfo ? (
          <Card size='sm' background='base-300'>
            <CardBody className='p-4'>
              <div className='flex justify-between items-center mb-2'>
                <CardTitle size='sm'>🐛 Debug Info</CardTitle>
                <button
                  onClick={() => setPreferences({ ...preferences, showDebugInfo: false })}
                  className='btn btn-ghost btn-xs'
                >
                  ✕
                </button>
              </div>
              <div className='text-xs font-mono space-y-1 opacity-70'>
                <div>URL: {searchParams.toString() || 'No parameters'}</div>
                <div>Account: {user?.account || 'Not signed in'}</div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <button
            onClick={() => setPreferences({ ...preferences, showDebugInfo: true })}
            className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'
          >
            🐛 Debug Info
          </button>
        ))}
    </div>
  )
}
