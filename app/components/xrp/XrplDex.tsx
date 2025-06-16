import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import useSWR, { mutate } from 'swr'
import type { BookOffersResponse } from 'xrpl'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { StatItem, StatsContainer } from '~/components/ui/Stats'
import { dig, getTx } from '~/utils/dig'
import { formatXRPBalance, useXRPLAccountData, useXRPLBalance } from '~/utils/xrpl'
import { useUser } from '~/utils/xumm'
import { Xaman } from './XummAuth'

// ===== 型定義 =====

interface SwapQuote {
  inputAmount: string
  outputAmount: string
  rate: number
  slippage: number
  fee: string
}

// ===== SWR キー定数 =====

const SWR_KEYS = {
  ACTIVE_TAB: 'xrpl-dex-active-tab',
  SWAP_FORM: 'xrpl-dex-swap-form',
  PAYMENT_FORM: 'xrpl-dex-payment-form',
  TRUSTSET_FORM: 'xrpl-dex-trustset-form',
} as const

// ===== Jotai Atoms (最小限) =====

const activeTabAtom = atomWithStorage<'swap' | 'payment' | 'trustset'>('xrpl-dex-active-tab', 'swap')

const swapFormAtom = atomWithStorage('xrpl-dex-swap-form', {
  fromToken: 'XRP',
  toToken: '',
  amount: '',
  slippage: '0.5',
})

const paymentFormAtom = atomWithStorage('xrpl-dex-payment-form', {
  destination: '',
  amount: '',
  currency: 'XRP',
  issuer: '',
  memo: '',
})

const trustSetFormAtom = atomWithStorage('xrpl-dex-trustset-form', {
  currency: '',
  issuer: '',
  limit: '',
})

// ===== 派生状態用 Atoms =====

// アカウントデータatom
const accountDataAtom = atom<any>(null)
const balanceAtom = atom<number>(0)
const digDataAtom = atom<any>(null)

// 派生データatoms
const formattedBalanceAtom = atom((get) => {
  const balance = get(balanceAtom)
  return balance ? formatXRPBalance(String(balance * 1000000)) : '0.000000'
})

const availableTokensAtom = atom((get) => {
  const formattedBalance = get(formattedBalanceAtom)
  const digData = get(digDataAtom)
  const trustLines = digData?.line || []

  return [
    {
      currency: 'XRP',
      name: 'XRP',
      symbol: 'XRP',
      balance: formattedBalance,
      isNative: true,
    },
    ...trustLines.map((line: any) => ({
      currency: line.currency,
      issuer: line.account, // AccountLinesTrustlineでは 'account' プロパティを使用
      name: line.currency,
      symbol: line.currency,
      balance: line.balance,
      limit: line.limit,
      isNative: false,
    })),
  ]
})

const accountStatsAtom = atom((get) => {
  const accountData = get(accountDataAtom)
  const digData = get(digDataAtom)

  return {
    sequence: accountData?.sequence || 0,
    ownerCount: accountData?.ownerCount || 0,
    trustLineCount: digData?.line?.length || 0,
    transactionCount: digData?.tx?.length || 0,
    nftCount: digData?.nft?.length || 0,
    reserve: ((accountData?.ownerCount || 0) * 2 + 10).toFixed(6),
  }
})

// ===== ユーティリティ関数 =====

function convertStringToHex(str: string): string {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase()
}

async function fetchBookOffers(
  takerGets: { currency: string; issuer?: string },
  takerPays: { currency: string; issuer?: string },
  networkEndpoint: string,
): Promise<BookOffersResponse['result']> {
  const response = await fetch(networkEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'book_offers',
      params: [
        {
          taker_gets: takerGets.currency === 'XRP' ? 'XRP' : takerGets,
          taker_pays: takerPays.currency === 'XRP' ? 'XRP' : takerPays,
          limit: 10,
        },
      ],
    }),
  })
  const data: { result: BookOffersResponse['result'] } = await response.json()
  return data.result
}

// ===== 共通ペイロード実行ロジック =====

async function executePayload(xumm: any, payload: any) {
  if (!payload?.next?.always) return

  if (xumm.xapp) {
    await xumm.xapp.openSignRequest(payload)
  } else {
    window.open(payload.next.always, '_blank')
  }
}

// ===== メインコンポーネント =====

interface XrplDexProps {
  defaultTab?: 'swap' | 'payment' | 'trustset'
  initialValues?: {
    swap?: {
      fromToken?: string
      toToken?: string
      amount?: string
    }
    payment?: {
      destination?: string
      amount?: string
    }
  }
  onTabChange?: (tab: 'swap' | 'payment' | 'trustset') => void
  onStateChange?: (updates: Record<string, string>) => void
}

export function XrplDex({ defaultTab = 'swap', initialValues, onTabChange, onStateChange }: XrplDexProps) {
  // ===== 基本状態 =====
  const [activeTab, setActiveTab] = useAtom(activeTabAtom)
  const [swapForm, setSwapForm] = useAtom(swapFormAtom)
  const [paymentForm, setPaymentForm] = useAtom(paymentFormAtom)
  const [trustSetForm, setTrustSetForm] = useAtom(trustSetFormAtom)

  // ===== 既存utilsを活用したデータ取得 =====
  const { xumm, user } = useUser()
  const {
    accountData,
    isLoading: accountLoading,
    error: accountError,
  } = useXRPLAccountData(user?.account, user?.networkEndpoint)
  const { balance, isLoading: balanceLoading } = useXRPLBalance(user?.account, user?.networkEndpoint)

  // Trust Lines & Transactions (dig使用)
  const { data: digData } = useSWR(
    user?.account ? ['dig-data', user.account, user.networkEndpoint] : null,
    async () => (user?.account ? await dig(user.account, user.networkEndpoint, 'line', 'tx', 'nft') : null),
    { refreshInterval: 30000 },
  )

  // ===== jotai atomsでの派生データ =====
  const availableTokens = useAtomValue(availableTokensAtom)
  const accountStats = useAtomValue(accountStatsAtom)
  const formattedBalance = useAtomValue(formattedBalanceAtom)

  // atomsを更新
  const setAccountData = useSetAtom(accountDataAtom)
  const setBalance = useSetAtom(balanceAtom)
  const setDigData = useSetAtom(digDataAtom)

  // データが変更されたらatomsを更新
  if (accountData !== null) setAccountData(accountData)
  if (balance !== null) setBalance(balance || 0)
  if (digData !== null) setDigData(digData)

  // ===== スワップクォート取得 =====
  const { data: quote } = useSWR(
    swapForm.fromToken && swapForm.toToken && swapForm.amount && user?.networkEndpoint
      ? ['swap-quote', swapForm.fromToken, swapForm.toToken, swapForm.amount, user.networkEndpoint]
      : null,
    async () => {
      if (!swapForm.fromToken || !swapForm.toToken || !swapForm.amount || !user?.networkEndpoint) return null

      const fromToken = availableTokens.find((t: any) => t.currency === swapForm.fromToken)
      const toToken = availableTokens.find((t: any) => t.currency === swapForm.toToken)

      if (!fromToken || !toToken) return null

      const offers = await fetchBookOffers(
        {
          currency: fromToken.currency,
          issuer: fromToken.isNative ? undefined : fromToken.issuer,
        },
        {
          currency: toToken.currency,
          issuer: toToken.isNative ? undefined : toToken.issuer,
        },
        user.networkEndpoint.replace('wss://', 'https://'),
      )

      if (offers.offers && offers.offers.length > 0) {
        const bestOffer = offers.offers[0]
        const rate = Number(bestOffer.quality) || 1
        const outputAmount = (Number(swapForm.amount) * rate).toFixed(6)

        return {
          inputAmount: swapForm.amount,
          outputAmount,
          rate,
          slippage: Number(swapForm.slippage) || 0.5,
          fee: '0.00001',
        }
      }
      return null
    },
    { refreshInterval: 5000 },
  )

  // ===== SWR Mutate-based ハンドラー関数群 =====

  const handleTabChange = (tab: 'swap' | 'payment' | 'trustset') => {
    setActiveTab(tab)
    mutate(SWR_KEYS.ACTIVE_TAB, tab, false)
    onTabChange?.(tab)
  }

  const handleSwapFormChange = (updates: Partial<typeof swapForm>) => {
    const newForm = { ...swapForm, ...updates }
    setSwapForm(newForm)
    mutate(SWR_KEYS.SWAP_FORM, newForm, false)
  }

  const handlePaymentFormChange = (updates: Partial<typeof paymentForm>) => {
    const newForm = { ...paymentForm, ...updates }
    setPaymentForm(newForm)
    mutate(SWR_KEYS.PAYMENT_FORM, newForm, false)
  }

  const handleTrustSetFormChange = (updates: Partial<typeof trustSetForm>) => {
    const newForm = { ...trustSetForm, ...updates }
    setTrustSetForm(newForm)
    mutate(SWR_KEYS.TRUSTSET_FORM, newForm, false)
  }

  const handlePaymentCurrencyChange = (currency: string) => {
    const token = availableTokens.find((t: any) => t.currency === currency)
    handlePaymentFormChange({
      currency,
      issuer: token?.issuer || '',
    })
  }

  // ===== トランザクション実行関数群 =====

  const executeSwap = async () => {
    if (!xumm || !quote || !user?.account) return

    const fromToken = availableTokens.find((t: any) => t.currency === swapForm.fromToken)
    const toToken = availableTokens.find((t: any) => t.currency === swapForm.toToken)

    if (!fromToken || !toToken) return

    const payload = await xumm.payload?.create({
      TransactionType: 'OfferCreate',
      Account: user.account,
      TakerGets:
        fromToken.currency === 'XRP'
          ? String(Number(swapForm.amount) * 1000000)
          : {
              currency: fromToken.currency,
              issuer: fromToken.issuer || '',
              value: swapForm.amount,
            },
      TakerPays:
        toToken.currency === 'XRP'
          ? String(Number(quote.outputAmount) * 1000000)
          : {
              currency: toToken.currency,
              issuer: toToken.issuer || '',
              value: quote.outputAmount,
            },
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('DEX_SWAP'),
            MemoData: convertStringToHex(`${swapForm.fromToken}->${swapForm.toToken}`),
          },
        },
      ],
    })

    await executePayload(xumm, payload)
  }

  const executePayment = async () => {
    if (!xumm || !user?.account) return

    const payload = await xumm.payload?.create({
      TransactionType: 'Payment',
      Account: user.account,
      Destination: paymentForm.destination,
      Amount:
        paymentForm.currency === 'XRP'
          ? String(Number(paymentForm.amount) * 1000000)
          : {
              currency: paymentForm.currency,
              issuer: paymentForm.issuer,
              value: paymentForm.amount,
            },
      ...(paymentForm.memo && {
        Memos: [
          {
            Memo: {
              MemoType: convertStringToHex('PAYMENT'),
              MemoData: convertStringToHex(paymentForm.memo),
            },
          },
        ],
      }),
    })

    await executePayload(xumm, payload)
  }

  const executeTrustSet = async () => {
    if (!xumm || !user?.account) return

    const payload = await xumm.payload?.create({
      TransactionType: 'TrustSet',
      Account: user.account,
      LimitAmount: {
        currency: trustSetForm.currency,
        issuer: trustSetForm.issuer,
        value: trustSetForm.limit,
      },
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('TRUST_SET'),
            MemoData: convertStringToHex(`${trustSetForm.currency}:${trustSetForm.issuer}`),
          },
        },
      ],
    })

    await executePayload(xumm, payload)
  }

  // ===== データ生成関数群 =====

  const generateQuoteStats = () => [
    {
      label: 'レート',
      value: `1 ${swapForm.fromToken} = ${quote?.rate.toFixed(6)} ${swapForm.toToken}`,
      icon: '📈',
    },
    { label: '受取予定', value: `${quote?.outputAmount} ${swapForm.toToken}`, icon: '💎' },
    { label: '手数料', value: `${quote?.fee} XRP`, icon: '💸' },
    { label: 'スリッページ', value: `${quote?.slippage}%`, icon: '📊' },
  ]

  const generateTabButtons = () => [
    { key: 'swap', icon: '🔄', label: 'スワップ' },
    { key: 'payment', icon: '💸', label: '送金' },
    { key: 'trustset', icon: '🤝', label: 'Trust Set' },
  ]

  // ===== ローディング & エラー状態 =====
  const isLoading = accountLoading || balanceLoading
  const error = accountError

  if (!user?.account) {
    return (
      <Card size='sm'>
        <CardBody className='p-6 text-center space-y-6'>
          <div className='text-6xl'>🔐</div>
          <div>
            <CardTitle size='lg' className='mb-2'>
              🚀 XRPL DEX
            </CardTitle>
            <p className='text-sm mb-4'>XUMMでサインインしてDEX機能を利用してください</p>
            <Xaman />
            <div className='badge badge-warning mt-2'>認証が必要です</div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {/* アカウント情報カード */}
      <Card size='sm'>
        <CardBody className='p-4'>
          <div className='flex justify-between items-center mb-4'>
            <CardTitle size='sm' className='flex items-center gap-2'>
              💼 <span>DEX アカウント</span>
            </CardTitle>
            <div className='flex gap-2'>
              <div className='badge badge-success badge-sm'>🔐 認証済み</div>
              {isLoading && <div className='badge badge-warning badge-sm'>更新中</div>}
            </div>
          </div>

          <StatsContainer>
            <StatItem
              title='アドレス'
              value={user.account.slice(0, 6) + '...' + user.account.slice(-4)}
              description={`Seq: ${accountStats.sequence}`}
              variant='primary'
            />
            <StatItem title='XRP残高' value={formattedBalance} description='XRP' variant='success' />
            <StatItem
              title='Trust Lines'
              value={accountStats.trustLineCount}
              description={`NFTs: ${accountStats.nftCount}`}
              variant='accent'
            />
            <StatItem
              title='リザーブ'
              value={`${accountStats.reserve} XRP`}
              description={`Owner: ${accountStats.ownerCount}`}
              variant='info'
            />
          </StatsContainer>
        </CardBody>
      </Card>

      {/* エラー表示 */}
      {error && (
        <div className='alert alert-error'>
          <span>{error.message || 'エラーが発生しました'}</span>
        </div>
      )}

      {/* 最新トランザクション */}
      {digData?.tx && digData.tx.length > 0 && (
        <Card size='sm'>
          <CardBody className='p-4'>
            <CardTitle size='sm' className='mb-3'>
              📋 最新トランザクション
            </CardTitle>
            <div className='bg-base-100 p-3 rounded border'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-3'>
                  <div className='badge badge-primary badge-sm'>{(digData.tx[0] as any)?.tx?.TransactionType}</div>
                  <div className='text-xs font-mono'>{(digData.tx[0] as any)?.tx?.hash?.slice(0, 10)}...</div>
                </div>
                <div className='text-xs'>
                  {new Date(((digData.tx[0] as any)?.tx?.date || 0) * 1000 + 946684800000).toLocaleString()}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* タブナビゲーション */}
      <div className='flex justify-center'>
        <div className='bg-base-200 p-2 rounded-box'>
          <div className='flex gap-1'>
            {generateTabButtons().map(({ key, icon, label }: { key: string; icon: string; label: string }) => (
              <button
                key={key}
                className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleTabChange(key as any)}
              >
                <span>{icon}</span>
                <span className='hidden sm:inline'>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* スワップタブ */}
      {activeTab === 'swap' && (
        <Card size='sm'>
          <CardBody className='p-4'>
            <CardTitle size='sm' className='mb-4'>
              🔄 トークンスワップ
            </CardTitle>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='form-control'>
                  <label htmlFor='fromToken' className='label'>
                    <span className='label-text'>📤 From</span>
                  </label>
                  <select
                    id='fromToken'
                    className='select select-bordered'
                    value={swapForm.fromToken}
                    onChange={(e) => handleSwapFormChange({ fromToken: e.target.value })}
                  >
                    {availableTokens.map((token: any) => (
                      <option key={'from-' + token.currency + '-' + (token.issuer || 'native')} value={token.currency}>
                        {token.currency} ({token.balance})
                      </option>
                    ))}
                  </select>
                </div>
                <div className='form-control'>
                  <label htmlFor='toToken' className='label'>
                    <span className='label-text'>📥 To</span>
                  </label>
                  <select
                    id='toToken'
                    className='select select-bordered'
                    value={swapForm.toToken}
                    onChange={(e) => handleSwapFormChange({ toToken: e.target.value })}
                  >
                    <option value=''>選択してください</option>
                    {availableTokens
                      .filter((t: any) => t.currency !== swapForm.fromToken)
                      .map((token: any) => (
                        <option key={'to-' + token.currency + '-' + (token.issuer || 'native')} value={token.currency}>
                          {token.currency}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='form-control'>
                  <label htmlFor='swapAmount' className='label'>
                    <span className='label-text'>💰 金額</span>
                  </label>
                  <input
                    id='swapAmount'
                    type='number'
                    className='input input-bordered'
                    value={swapForm.amount}
                    onChange={(e) => handleSwapFormChange({ amount: e.target.value })}
                    placeholder='スワップする金額'
                  />
                </div>
                <div className='form-control'>
                  <label htmlFor='slippage' className='label'>
                    <span className='label-text'>📊 スリッページ (%)</span>
                  </label>
                  <input
                    id='slippage'
                    type='number'
                    className='input input-bordered'
                    value={swapForm.slippage}
                    onChange={(e) => handleSwapFormChange({ slippage: e.target.value })}
                    placeholder='0.5'
                    step='0.1'
                  />
                </div>
              </div>

              {quote && (
                <div className='bg-success/10 p-4 rounded border border-success/30'>
                  <h4 className='font-semibold mb-3'>
                    📊 スワップ見積もり
                    <div className='badge badge-success badge-sm ml-2'>取得済み</div>
                  </h4>
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                    {generateQuoteStats().map(
                      ({ label, value, icon }: { label: string; value: string; icon: string }) => (
                        <div key={label} className='bg-base-100 p-3 rounded text-center'>
                          <div className='text-xs mb-1'>
                            {icon} {label}
                          </div>
                          <div className='font-mono text-sm font-medium'>{value}</div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <button className='btn btn-primary btn-lg w-full' onClick={executeSwap} disabled={!quote || isLoading}>
                {isLoading ? (
                  <>
                    <span className='loading loading-spinner'></span>
                    処理中...
                  </>
                ) : (
                  <>
                    🚀 スワップを実行
                    {quote && <div className='badge badge-success badge-sm ml-2'>準備完了</div>}
                  </>
                )}
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 送金タブ */}
      {activeTab === 'payment' && (
        <Card size='sm'>
          <CardBody className='p-4'>
            <CardTitle size='sm' className='mb-4'>
              💸 送金
            </CardTitle>
            <div className='space-y-6'>
              <div className='form-control'>
                <label htmlFor='destination' className='label'>
                  <span className='label-text'>🎯 送金先アドレス</span>
                </label>
                <input
                  id='destination'
                  type='text'
                  className='input input-bordered'
                  value={paymentForm.destination}
                  onChange={(e) => handlePaymentFormChange({ destination: e.target.value })}
                  placeholder='r...'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='form-control'>
                  <label htmlFor='paymentCurrency' className='label'>
                    <span className='label-text'>💰 通貨</span>
                  </label>
                  <select
                    id='paymentCurrency'
                    className='select select-bordered'
                    value={paymentForm.currency}
                    onChange={(e) => handlePaymentCurrencyChange(e.target.value)}
                  >
                    {availableTokens.map((token: any) => (
                      <option key={token.currency + '-' + (token.issuer || 'native')} value={token.currency}>
                        {token.currency} ({token.balance})
                      </option>
                    ))}
                  </select>
                </div>
                <div className='form-control'>
                  <label htmlFor='paymentAmount' className='label'>
                    <span className='label-text'>📊 金額</span>
                  </label>
                  <input
                    id='paymentAmount'
                    type='number'
                    className='input input-bordered'
                    value={paymentForm.amount}
                    onChange={(e) => handlePaymentFormChange({ amount: e.target.value })}
                    placeholder='送金金額'
                  />
                </div>
              </div>

              <div className='form-control'>
                <label htmlFor='memo' className='label'>
                  <span className='label-text'>📝 メモ（オプション）</span>
                </label>
                <input
                  id='memo'
                  type='text'
                  className='input input-bordered'
                  value={paymentForm.memo}
                  onChange={(e) => handlePaymentFormChange({ memo: e.target.value })}
                  placeholder='メモ'
                />
              </div>

              <button
                className='btn btn-secondary btn-lg w-full'
                onClick={executePayment}
                disabled={!paymentForm.destination || !paymentForm.amount}
              >
                🚀 送金を実行
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Trust Setタブ */}
      {activeTab === 'trustset' && (
        <Card size='sm'>
          <CardBody className='p-4'>
            <CardTitle size='sm' className='mb-4'>
              🤝 Trust Line設定
            </CardTitle>
            <div className='space-y-6'>
              <div className='form-control'>
                <label htmlFor='trustCurrency' className='label'>
                  <span className='label-text'>💰 通貨コード</span>
                </label>
                <input
                  id='trustCurrency'
                  type='text'
                  className='input input-bordered'
                  value={trustSetForm.currency}
                  onChange={(e) => handleTrustSetFormChange({ currency: e.target.value.toUpperCase() })}
                  placeholder='USD, EUR, JPY など'
                  maxLength={3}
                />
              </div>

              <div className='form-control'>
                <label htmlFor='trustIssuer' className='label'>
                  <span className='label-text'>🏛️ Issuerアドレス</span>
                </label>
                <input
                  id='trustIssuer'
                  type='text'
                  className='input input-bordered'
                  value={trustSetForm.issuer}
                  onChange={(e) => handleTrustSetFormChange({ issuer: e.target.value })}
                  placeholder='r...'
                />
              </div>

              <div className='form-control'>
                <label htmlFor='trustLimit' className='label'>
                  <span className='label-text'>📊 信頼限度額</span>
                </label>
                <input
                  id='trustLimit'
                  type='number'
                  className='input input-bordered'
                  value={trustSetForm.limit}
                  onChange={(e) => handleTrustSetFormChange({ limit: e.target.value })}
                  placeholder='1000000'
                />
              </div>

              <button
                className='btn btn-accent btn-lg w-full'
                onClick={executeTrustSet}
                disabled={!trustSetForm.currency || !trustSetForm.issuer || !trustSetForm.limit}
              >
                🚀 Trust Lineを設定
              </button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
