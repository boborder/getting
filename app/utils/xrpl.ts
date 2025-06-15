import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import useSWR from 'swr'
import * as v from 'valibot'
import type {
  AccountInfoResponse,
  AccountLinesResponse,
  AccountLinesTrustline,
  AccountNFToken,
  AccountNFTsResponse,
  AccountTxResponse,
  AccountTxTransaction,
  BookOffersResponse,
  FeeResponse,
  ServerInfoResponse,
} from 'xrpl'

// ===== ネットワーク設定 =====

export type NetworkInfo = {
  readonly url: string
  readonly name: string
  readonly emoji: string
  readonly type: 'mainnet' | 'testnet' | 'devnet' | 'xahau' | 'xahau-test'
  readonly httpEndpoint: string
  readonly description: string
}

export const NETWORK_CONFIGS = {
  MAINNET: {
    url: 'wss://xrplcluster.com',
    name: 'Mainnet',
    emoji: '🌏',
    type: 'mainnet' as const,
    httpEndpoint: 'https://xrplcluster.com',
    description: 'XRPL本番ネットワーク',
  },
  TESTNET: {
    url: 'wss://testnet.xrpl-labs.com',
    name: 'Testnet',
    emoji: '🔑',
    type: 'testnet' as const,
    httpEndpoint: 'https://testnet.xrpl-labs.com',
    description: 'XRPLテストネットワーク',
  },
  DEVNET: {
    url: 'wss://s.devnet.rippletest.net:51233',
    name: 'Devnet',
    emoji: '🔒',
    type: 'devnet' as const,
    httpEndpoint: 'https://s.devnet.rippletest.net:51234',
    description: 'XRPL開発ネットワーク',
  },
  XAHAU: {
    url: 'wss://xahau.network',
    name: 'Xahau Network',
    emoji: '🍕',
    type: 'xahau' as const,
    httpEndpoint: 'https://xahau.network',
    description: 'Xahauメインネットワーク',
  },
  XAHAU_TEST: {
    url: 'wss://xahau-test.net',
    name: 'Xahau Testnet',
    emoji: '🍍',
    type: 'xahau-test' as const,
    httpEndpoint: 'https://xahau-test.net',
    description: 'Xahauテストネットワーク',
  },
} as const satisfies Record<string, NetworkInfo>

export const NETWORK_LIST = Object.values(NETWORK_CONFIGS) as readonly NetworkInfo[]

export const findNetworkByUrl = (url: string): NetworkInfo | undefined =>
  NETWORK_LIST.find((network) => network.url === url)

// ===== バリデーションスキーマ =====

export const AccountFormSchema = v.object({
  address: v.pipe(
    v.string(),
    v.minLength(25, 'XRPLアドレスは25文字以上である必要があります'),
    v.maxLength(34, 'XRPLアドレスは34文字以下である必要があります'),
    v.regex(/^r[a-zA-Z0-9]{24,33}$/, 'XRPLアドレスの形式が正しくありません'),
  ),
  network: v.pipe(v.string(), v.minLength(1, 'ネットワークを選択してください')),
})

// ===== 型定義 =====

export type AccountFormData = v.InferInput<typeof AccountFormSchema>

export interface XRPLAccountData {
  address: string
  network: string
  networkInfo: ReturnType<typeof findNetworkByUrl>
  balance: string
  sequence: number
  ownerCount: number
  transactions: number
  nfts: number
  trustlines: number
  isActivated: boolean
  errors: Record<string, string>
  raw: {
    info: AccountInfoResponse | null
    tx: AccountTxTransaction[]
    nft: AccountNFToken[]
    line: AccountLinesTrustline[]
  }
}

export interface XRPLPriceData {
  xrpUsd: number
  xrpJpy?: number
  lastUpdated: number
  source: 'dex' | 'api'
}

export interface XRPLFeeData {
  baseFee: string
  openLedgerFee: string
  ledgerIndex: number
  networkUrl: string
  lastUpdated: number
}

export interface XRPLBalanceData {
  balance: number
  account: string
  networkUrl: string
  lastUpdated: number
}

// ===== Jotai Atoms =====

// キャッシュ用のAtom群
export const xrplPriceAtom = atom<XRPLPriceData | null>(null)
export const xrplFeeAtom = atom<Record<string, XRPLFeeData>>({})
export const xrplBalanceAtom = atom<Record<string, XRPLBalanceData>>({})
export const xrplAccountDataAtom = atom<Record<string, XRPLAccountData>>({})

// ユーザー設定用のAtom
export const defaultAddressAtom = atomWithStorage<string>('xrpl-default-address', '')
export const favoriteAddressesAtom = atomWithStorage<string[]>('xrpl-favorite-addresses', [])

// ===== フォーマット関数 =====

export const formatXRPBalance = (balance: string | number): string => {
  const numBalance = typeof balance === 'string' ? Number(balance) : balance
  return (numBalance / 1000000).toFixed(6)
}

export const formatAccountStatus = (isActivated: boolean) => {
  return isActivated ? { text: 'アクティベート済み', color: 'success' } : { text: '未アクティベート', color: 'warning' }
}

export const getNetworkBadgeClass = (networkType: string): string => {
  switch (networkType?.toLowerCase()) {
    case 'mainnet':
      return 'badge-success'
    case 'testnet':
      return 'badge-warning'
    case 'devnet':
      return 'badge-info'
    default:
      return 'badge-neutral'
  }
}

export const truncateAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address || address.length <= startChars + endChars) {
    return address
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// ===== XRPL API関数群 =====

export async function makeXRPLRequest<T = any>(
  endpoint: string,
  method: string,
  params: any,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method,
      params: [params],
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data: { result: T; error?: string } = await response.json()

  if (data.error) {
    throw new Error(`XRPL Error: ${data.error}`)
  }

  return data.result
}

export async function fetchAccountInfo(
  endpoint: string,
  account: string,
  signal?: AbortSignal,
): Promise<AccountInfoResponse['result']['account_data'] | null> {
  try {
    const result = await makeXRPLRequest<AccountInfoResponse['result']>(endpoint, 'account_info', { account }, signal)
    return result.account_data
  } catch (error: any) {
    if (error.message?.includes('actNotFound')) {
      console.log('❌ アカウント未アクティベート:', account)
      return null
    }
    throw error
  }
}

export async function fetchAccountTx(
  endpoint: string,
  account: string,
  signal?: AbortSignal,
): Promise<AccountTxTransaction[]> {
  try {
    const result = await makeXRPLRequest<AccountTxResponse['result']>(
      endpoint,
      'account_tx',
      {
        account,
        ledger_index_max: -1,
        limit: 10,
      },
      signal,
    )
    return result.transactions || []
  } catch (error) {
    console.warn('⚠️ account_tx取得エラー:', error)
    return []
  }
}

export async function fetchAccountNFTs(
  endpoint: string,
  account: string,
  signal?: AbortSignal,
): Promise<AccountNFToken[]> {
  try {
    const result = await makeXRPLRequest<AccountNFTsResponse['result']>(endpoint, 'account_nfts', { account }, signal)
    return result.account_nfts || []
  } catch (error) {
    console.warn('⚠️ account_nfts取得エラー:', error)
    return []
  }
}

export async function fetchAccountLines(
  endpoint: string,
  account: string,
  signal?: AbortSignal,
): Promise<AccountLinesTrustline[]> {
  try {
    const result = await makeXRPLRequest<AccountLinesResponse['result']>(endpoint, 'account_lines', { account }, signal)
    return result.lines || []
  } catch (error) {
    console.warn('⚠️ account_lines取得エラー:', error)
    return []
  }
}

// ===== 価格取得関数 =====

export async function fetchXRPPrice(): Promise<XRPLPriceData> {
  const response = await fetch('https://xrpl.ws', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'book_offers',
      params: [
        {
          taker: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
          taker_gets: { currency: 'XRP' },
          taker_pays: {
            currency: 'USD',
            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
          },
          limit: 1,
        },
      ],
    }),
  })

  const data: { result: BookOffersResponse['result'] } = await response.json()
  const price = Number(data?.result?.offers?.[0]?.quality) * 1000000

  return {
    xrpUsd: price || 0,
    lastUpdated: Date.now(),
    source: 'dex',
  }
}

// ===== 手数料取得関数 =====

export async function fetchXRPLFee(networkUrl: string): Promise<XRPLFeeData> {
  const networkInfo = findNetworkByUrl(networkUrl)
  if (!networkInfo) throw new Error('Network not found')

  const response = await fetch(networkInfo.httpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'fee',
      params: [{}],
    }),
  })

  const data: { result: FeeResponse['result'] } = await response.json()
  const result = data?.result

  return {
    baseFee: result?.drops?.base_fee || '10',
    openLedgerFee: result?.drops?.open_ledger_fee || '10',
    ledgerIndex: result?.ledger_current_index || 0,
    networkUrl,
    lastUpdated: Date.now(),
  }
}

// ===== 残高取得関数 =====

export async function fetchXRPLBalance(account: string, networkUrl: string): Promise<XRPLBalanceData> {
  const networkInfo = findNetworkByUrl(networkUrl)
  if (!networkInfo) throw new Error('Network not found')

  const response = await fetch(networkInfo.httpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_info',
      params: [{ account }],
    }),
  })

  const data: { result: AccountInfoResponse['result'] } = await response.json()
  const balance = Number(data?.result?.account_data?.Balance || 0) / 1000000

  return {
    balance,
    account,
    networkUrl,
    lastUpdated: Date.now(),
  }
}

// ===== サーバー情報取得関数 =====
export async function fetchXRPLServerInfo(networkUrl: string): Promise<ServerInfoResponse['result']> {
  const networkInfo = findNetworkByUrl(networkUrl)
  if (!networkInfo) throw new Error('Network not found')

  const response = await fetch(networkInfo.httpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'server_info',
      params: [{}],
    }),
  })

  const data: { result: ServerInfoResponse['result'] } = await response.json()
  return data?.result
}

// ===== メイン関数：包括的なアカウントデータ取得 =====

export async function fetchXRPLAccountData(address: string, network: string): Promise<XRPLAccountData> {
  const networkInfo = findNetworkByUrl(network)
  const httpEndpoint = networkInfo?.httpEndpoint || 'https://xrpl.ws'

  console.log('🌐 HTTP エンドポイント:', httpEndpoint, `(${networkInfo?.name || 'Unknown'})`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const [infoResult, txResult, nftResult, lineResult] = await Promise.allSettled([
      fetchAccountInfo(httpEndpoint, address, controller.signal),
      fetchAccountTx(httpEndpoint, address, controller.signal),
      fetchAccountNFTs(httpEndpoint, address, controller.signal),
      fetchAccountLines(httpEndpoint, address, controller.signal),
    ])

    clearTimeout(timeoutId)

    const accountInfo = infoResult.status === 'fulfilled' ? infoResult.value : null
    const transactions = txResult.status === 'fulfilled' ? txResult.value : []
    const nfts = nftResult.status === 'fulfilled' ? nftResult.value : []
    const trustlines = lineResult.status === 'fulfilled' ? lineResult.value : []

    const errors: Record<string, string> = {}
    if (infoResult.status === 'rejected') errors.info = infoResult.reason?.message || 'account_info取得エラー'
    if (txResult.status === 'rejected') errors.tx = txResult.reason?.message || 'account_tx取得エラー'
    if (nftResult.status === 'rejected') errors.nft = nftResult.reason?.message || 'account_nfts取得エラー'
    if (lineResult.status === 'rejected') errors.line = lineResult.reason?.message || 'account_lines取得エラー'

    const isActivated = !!accountInfo
    const balance = accountInfo?.Balance ? formatXRPBalance(accountInfo.Balance) : '0'

    return {
      address,
      network,
      networkInfo,
      balance,
      sequence: accountInfo?.Sequence || 0,
      ownerCount: accountInfo?.OwnerCount || 0,
      transactions: transactions.length,
      nfts: nfts.length,
      trustlines: trustlines.length,
      isActivated,
      errors,
      raw: {
        info: accountInfo ? ({ result: { account_data: accountInfo } } as AccountInfoResponse) : null,
        tx: transactions,
        nft: nfts,
        line: trustlines,
      },
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// ===== カスタムフック群 =====

export const useXRPLPrice = () => {
  const {
    data: priceData,
    error,
    mutate,
    isLoading,
  } = useSWR('xrpl-price', fetchXRPPrice, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  return {
    price: priceData?.xrpUsd || 0,
    priceJpy: priceData?.xrpJpy,
    lastUpdated: priceData?.lastUpdated,
    source: priceData?.source,
    refresh: mutate,
    isLoading,
    error,
    isStale: priceData ? Date.now() - priceData.lastUpdated > 30000 : true,
  }
}

export const useXRPLFee = (networkUrl: string) => {
  const {
    data: feeData,
    error,
    mutate,
    isLoading,
  } = useSWR(networkUrl ? ['xrpl-fee', networkUrl] : null, () => fetchXRPLFee(networkUrl), {
    refreshInterval: 3000,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })

  return {
    baseFee: feeData?.baseFee || '10',
    openLedgerFee: feeData?.openLedgerFee || '10',
    ledgerIndex: feeData?.ledgerIndex || 0,
    lastUpdated: feeData?.lastUpdated,
    refresh: mutate,
    isLoading,
    error,
    isStale: feeData ? Date.now() - feeData.lastUpdated > 10000 : true,
  }
}

export const useXRPLBalance = (account?: string, networkUrl?: string) => {
  const {
    data: balanceData,
    error,
    mutate,
    isLoading,
  } = useSWR(
    account && networkUrl ? ['xrpl-balance', account, networkUrl] : null,
    () => fetchXRPLBalance(account!, networkUrl!),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  )

  return {
    balance: balanceData?.balance || 0,
    lastUpdated: balanceData?.lastUpdated,
    refresh: mutate,
    isLoading: isLoading && !!account && !!networkUrl,
    error,
    isStale: balanceData ? Date.now() - balanceData.lastUpdated > 120000 : true,
  }
}

export const useXRPLAccountData = (address?: string, network?: string) => {
  const {
    data: accountData,
    error,
    mutate,
    isLoading,
  } = useSWR(
    address && network ? ['xrpl-account', address, network] : null,
    () => fetchXRPLAccountData(address!, network!),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    },
  )

  return {
    accountData,
    refresh: mutate,
    isLoading: isLoading && !!address && !!network,
    error,
    isStale: accountData ? Date.now() - (Date.now() - 60000) > 60000 : true,
  }
}
