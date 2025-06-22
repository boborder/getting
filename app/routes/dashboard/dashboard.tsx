import { getFormProps, getInputProps, getSelectProps, useForm } from '@conform-to/react'
import { getValibotConstraint, parseWithValibot } from 'conform-to-valibot'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Form, useSearchParams } from 'react-router'
import useSWR, { mutate } from 'swr'
import * as v from 'valibot'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { XrplDex } from '~/components/xrp/XrplDex'
import { useUser } from '~/utils/xumm'
import type { Route } from './+types/dashboard'

// ===== バリデーションスキーマ =====

const QuickSwapSchema = v.object({
  fromToken: v.pipe(v.string(), v.minLength(1, 'From通貨を選択してください')),
  toToken: v.pipe(v.string(), v.minLength(1, 'To通貨を選択してください')),
  amount: v.pipe(
    v.string(),
    v.minLength(1, '金額を入力してください'),
    v.transform(Number),
    v.number(),
    v.minValue(0.000001, '金額は0.000001以上である必要があります'),
  ),
})

const QuickPaymentSchema = v.object({
  destination: v.pipe(
    v.string(),
    v.minLength(1, '送金先アドレスを入力してください'),
    v.regex(/^r[a-zA-Z0-9]{24,33}$/, '有効なXRPLアドレスを入力してください'),
  ),
  currency: v.pipe(v.string(), v.minLength(1, '通貨を選択してください')),
  amount: v.pipe(
    v.string(),
    v.minLength(1, '金額を入力してください'),
    v.transform(Number),
    v.number(),
    v.minValue(0.000001, '金額は0.000001以上である必要があります'),
  ),
})

// ===== 型定義 =====

type QuickSwapForm = v.InferInput<typeof QuickSwapSchema>
type QuickPaymentForm = v.InferInput<typeof QuickPaymentSchema>

interface URLParams {
  tab: 'swap' | 'payment' | 'trustset'
  fromToken: string
  toToken: string
  amount: string
  destination: string
}

// ===== Jotai Atoms =====

const dashboardPreferencesAtom = atomWithStorage('dashboard-preferences', {
  showDebugInfo: false,
  autoRefresh: true,
  showQuickForms: true,
})

const availableCurrenciesAtom = atom(['XRP', 'USD', 'EUR', 'JPY', 'BTC', 'ETH'])

// ===== SWR キー定数 =====

const SWR_KEYS = {
  URL_PARAMS: 'dashboard-url-params',
  PREFERENCES: 'dashboard-preferences',
} as const

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
  const [preferences, setPreferences] = useAtom(dashboardPreferencesAtom)
  const availableCurrencies = useAtom(availableCurrenciesAtom)[0]
  const { user } = useUser()

  // ===== SWR-based URL同期 =====

  const { data: urlParams } = useSWR<URLParams>(
    SWR_KEYS.URL_PARAMS,
    () => ({
      tab: (searchParams.get('tab') as 'swap' | 'payment' | 'trustset') || 'swap',
      fromToken: searchParams.get('from') || 'XRP',
      toToken: searchParams.get('to') || '',
      amount: searchParams.get('amount') || '',
      destination: searchParams.get('destination') || '',
    }),
    {
      fallbackData: {
        tab: 'swap' as const,
        fromToken: 'XRP',
        toToken: '',
        amount: '',
        destination: '',
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // searchParamsが変更されたらSWRデータを更新
  useSWR(
    ['search-params-sync', searchParams.toString()],
    () => {
      const newParams: URLParams = {
        tab: (searchParams.get('tab') as 'swap' | 'payment' | 'trustset') || 'swap',
        fromToken: searchParams.get('from') || 'XRP',
        toToken: searchParams.get('to') || '',
        amount: searchParams.get('amount') || '',
        destination: searchParams.get('destination') || '',
      }
      mutate(SWR_KEYS.URL_PARAMS, newParams, false)
      return newParams
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )

  // ===== SWR Mutate-based ハンドラー関数群 =====

  const updateURLAndParams = (newParams: Partial<URLParams>) => {
    const updated = { ...urlParams!, ...newParams }

    // SWRキャッシュを即座に更新
    mutate(SWR_KEYS.URL_PARAMS, updated, false)

    // URLを更新
    const newSearchParams = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updated)) {
      if (value) {
        newSearchParams.set(key === 'fromToken' ? 'from' : key === 'toToken' ? 'to' : key, value)
      } else {
        newSearchParams.delete(key === 'fromToken' ? 'from' : key === 'toToken' ? 'to' : key)
      }
    }
    setSearchParams(newSearchParams)
  }

  const handleTabChange = (tab: 'swap' | 'payment' | 'trustset') => {
    updateURLAndParams({ tab })
  }

  const handleQuickSwap = (fromToken: string, toToken: string, amount: string) => {
    updateURLAndParams({
      tab: 'swap',
      fromToken,
      toToken,
      amount,
    })
  }

  const handleQuickPayment = (destination: string, amount: string) => {
    updateURLAndParams({
      tab: 'payment',
      destination,
      amount,
    })
  }

  const handleStateChange = (updates: Record<string, string>) => {
    updateURLAndParams(updates as Partial<URLParams>)
  }

  const toggleQuickForms = () => {
    const newPrefs = { ...preferences, showQuickForms: !preferences.showQuickForms }
    setPreferences(newPrefs)
    mutate(SWR_KEYS.PREFERENCES, newPrefs, false)
  }

  const toggleDebugInfo = () => {
    const newPrefs = { ...preferences, showDebugInfo: !preferences.showDebugInfo }
    setPreferences(newPrefs)
    mutate(SWR_KEYS.PREFERENCES, newPrefs, false)
  }

  // ===== Conform Forms =====

  const [quickSwapForm, quickSwapFields] = useForm({
    id: 'quick-swap',
    constraint: getValibotConstraint(QuickSwapSchema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: QuickSwapSchema })
    },
    onSubmit(event, context) {
      event.preventDefault()
      if (context.submission?.status === 'success') {
        const { fromToken, toToken, amount } = context.submission.value
        handleQuickSwap(fromToken, toToken, amount.toString())
      }
    },
    defaultValue: {
      fromToken: urlParams?.fromToken || 'XRP',
      toToken: urlParams?.toToken || 'USD',
      amount: urlParams?.amount || '100',
    },
  })

  const [quickPaymentForm, quickPaymentFields] = useForm({
    id: 'quick-payment',
    constraint: getValibotConstraint(QuickPaymentSchema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: QuickPaymentSchema })
    },
    onSubmit(event, context) {
      event.preventDefault()
      if (context.submission?.status === 'success') {
        const { destination, amount } = context.submission.value
        handleQuickPayment(destination, amount.toString())
      }
    },
    defaultValue: {
      destination: urlParams?.destination || '',
      currency: 'XRP',
      amount: urlParams?.amount || '10',
    },
  })

  if (!urlParams) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <span className='loading loading-spinner loading-lg'></span>
      </div>
    )
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
            <div className='flex gap-2'>
              <button onClick={toggleQuickForms} className='btn btn-ghost btn-sm'>
                {preferences.showQuickForms ? '📋 フォーム非表示' : '📋 フォーム表示'}
              </button>
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

      {/* Conformベースのクイックアクション */}
      {preferences.showQuickForms && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* クイックスワップフォーム */}
          <Card size='sm' className='bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20'>
            <CardBody className='p-4'>
              <CardTitle size='sm' className='mb-3 flex items-center gap-2'>
                🔄 クイックスワップ
              </CardTitle>
              <form {...getFormProps(quickSwapForm)}>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='form-control'>
                      <label htmlFor={quickSwapFields.fromToken.id} className='label label-text-alt font-medium'>
                        From
                      </label>
                      <select
                        {...getSelectProps(quickSwapFields.fromToken)}
                        className='select select-bordered select-sm'
                      >
                        {availableCurrencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                      <div className='text-error text-xs mt-1'>{quickSwapFields.fromToken.errors}</div>
                    </div>
                    <div className='form-control'>
                      <label htmlFor={quickSwapFields.toToken.id} className='label label-text-alt font-medium'>
                        To
                      </label>
                      <select {...getSelectProps(quickSwapFields.toToken)} className='select select-bordered select-sm'>
                        {availableCurrencies
                          .filter((c) => c !== quickSwapFields.fromToken.value)
                          .map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                      </select>
                      <div className='text-error text-xs mt-1'>{quickSwapFields.toToken.errors}</div>
                    </div>
                  </div>
                  <div className='form-control'>
                    <label htmlFor={quickSwapFields.amount.id} className='label label-text-alt font-medium'>
                      金額
                    </label>
                    <input
                      {...getInputProps(quickSwapFields.amount, { type: 'number' })}
                      className='input input-bordered input-sm'
                      placeholder='100'
                      step='0.000001'
                    />
                    <div className='text-error text-xs mt-1'>{quickSwapFields.amount.errors}</div>
                  </div>
                  <button type='submit' className='btn btn-primary btn-sm w-full'>
                    🚀 スワップ実行
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* クイック送金フォーム */}
          <Card size='sm' className='bg-gradient-to-br from-secondary/5 to-info/5 border border-secondary/20'>
            <CardBody className='p-4'>
              <CardTitle size='sm' className='mb-3 flex items-center gap-2'>
                💸 クイック送金
              </CardTitle>
              <form {...getFormProps(quickPaymentForm)}>
                <div className='space-y-4'>
                  <div className='form-control'>
                    <label htmlFor={quickPaymentFields.destination.id} className='label label-text-alt font-medium'>
                      送金先アドレス
                    </label>
                    <input
                      {...getInputProps(quickPaymentFields.destination, { type: 'text' })}
                      className='input input-bordered input-sm'
                      placeholder='r...'
                    />
                    <div className='text-error text-xs mt-1'>{quickPaymentFields.destination.errors}</div>
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='form-control'>
                      <label htmlFor={quickPaymentFields.currency.id} className='label label-text-alt font-medium'>
                        通貨
                      </label>
                      <select
                        {...getSelectProps(quickPaymentFields.currency)}
                        className='select select-bordered select-sm'
                      >
                        {availableCurrencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                      <div className='text-error text-xs mt-1'>{quickPaymentFields.currency.errors}</div>
                    </div>
                    <div className='form-control'>
                      <label htmlFor={quickPaymentFields.amount.id} className='label label-text-alt font-medium'>
                        金額
                      </label>
                      <input
                        {...getInputProps(quickPaymentFields.amount, { type: 'number' })}
                        className='input input-bordered input-sm'
                        placeholder='10'
                        step='0.000001'
                      />
                      <div className='text-error text-xs mt-1'>{quickPaymentFields.amount.errors}</div>
                    </div>
                  </div>
                  <button type='submit' className='btn btn-secondary btn-sm w-full'>
                    🚀 送金実行
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

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
                <button onClick={toggleDebugInfo} className='btn btn-ghost btn-xs'>
                  ✕
                </button>
              </div>
              <div className='text-xs font-mono space-y-1 opacity-70'>
                <div>URL: {searchParams.toString() || 'No parameters'}</div>
                <div>Account: {user?.account || 'Not signed in'}</div>
                <div>Quick Forms: {preferences.showQuickForms ? 'Enabled' : 'Disabled'}</div>
                <div>SWR Cache: {JSON.stringify(urlParams)}</div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <button onClick={toggleDebugInfo} className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'>
            🐛 Debug Info
          </button>
        ))}
    </div>
  )
}
