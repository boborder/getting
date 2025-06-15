import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage, useHydrateAtoms } from 'jotai/utils'
import type { ServerInfoResponse } from 'xrpl'

// ===== 型定義 =====

export type NetworkInfo = {
  readonly url: string
  readonly name: string
  readonly emoji: string
  readonly type: 'mainnet' | 'testnet' | 'devnet' | 'xahau' | 'xahau-test'
  readonly httpEndpoint: string
  readonly description: string
}

type NetworkStatus = {
  online: boolean
  latency: number
  error?: string
  serverInfo?: {
    ledgerVersion: number
    ledgerHash: string
    fee: string
    openLedgerFee: string
  } | null
  lastUpdated: number
}

// ===== ネットワーク設定 =====

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

// ===== ヘルパー関数 =====

export const findNetworkByUrl = (url: string): NetworkInfo | undefined =>
  NETWORK_LIST.find((network) => network.url === url)

export const findNetworkByType = (type: NetworkInfo['type']): NetworkInfo | undefined =>
  NETWORK_LIST.find((network) => network.type === type)

// ===== Jotai Atoms（共有） =====

// ネットワーク管理
export const networkAtom = atomWithStorage<string>('xrpl-network', NETWORK_CONFIGS.MAINNET.url)
export const currentNetworkInfoAtom = atom((get) => {
  const networkUrl = get(networkAtom)
  return findNetworkByUrl(networkUrl) || NETWORK_CONFIGS.MAINNET
})
export const httpEndpointAtom = atom((get) => {
  const networkInfo = get(currentNetworkInfoAtom)
  return networkInfo.httpEndpoint
})
export const isMainnetAtom = atom((get) => {
  const networkInfo = get(currentNetworkInfoAtom)
  return networkInfo.type === 'mainnet'
})
export const isTestnetAtom = atom((get) => {
  const networkInfo = get(currentNetworkInfoAtom)
  return networkInfo.type === 'testnet'
})
export const networkOptionsAtom = atom(() =>
  NETWORK_LIST.map((network) => ({
    value: network.url,
    label: `${network.name} ${network.emoji}`,
    description: network.description,
    network,
  })),
)

// ネットワーク状態管理
export const networkStatusAtom = atom<Record<string, NetworkStatus>>({})
export const currentNetworkStatusAtom = atom((get) => {
  const networkUrl = get(networkAtom)
  const statusMap = get(networkStatusAtom)
  return statusMap[networkUrl] || null
})

// ネットワーク状態取得用の非同期Atom
export const fetchNetworkStatusAtom = atom(null, async (_get, set, networkUrl: string) => {
  const networkInfo = findNetworkByUrl(networkUrl)
  if (!networkInfo) return

  try {
    const response = await fetch(networkInfo.httpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'server_info', params: [{}] }),
    })
    const result = (await response.json()) as { error?: string; result?: ServerInfoResponse['result'] }

    const serverInfo = result?.result?.info
    const hasValidInfo = !!(serverInfo && typeof serverInfo === 'object')

    const status: NetworkStatus = {
      online: !result.error && hasValidInfo,
      latency: Date.now(),
      error: result.error,
      serverInfo: hasValidInfo
        ? {
            ledgerVersion: serverInfo.validated_ledger?.seq || 0,
            ledgerHash: serverInfo.validated_ledger?.hash || '',
            fee: String(serverInfo.validated_ledger?.base_fee_xrp || '0.00001'),
            openLedgerFee: serverInfo.load_factor
              ? String(Number(serverInfo.validated_ledger?.base_fee_xrp || '0.00001') * serverInfo.load_factor)
              : String(serverInfo.validated_ledger?.base_fee_xrp || '0.00001'),
          }
        : null,
      lastUpdated: Date.now(),
    }

    set(networkStatusAtom, (prev) => ({
      ...prev,
      [networkUrl]: status,
    }))

    return status
  } catch (error) {
    const errorStatus: NetworkStatus = {
      online: false,
      latency: -1,
      error: error instanceof Error ? error.message : 'Network error',
      serverInfo: null,
      lastUpdated: Date.now(),
    }

    set(networkStatusAtom, (prev) => ({
      ...prev,
      [networkUrl]: errorStatus,
    }))

    return errorStatus
  }
})

// ===== カスタムフック群（共有） =====

// ネットワーク管理フック
export const useNetwork = () => {
  const [networkUrl, setNetworkUrl] = useAtom(networkAtom)
  const networkInfo = useAtomValue(currentNetworkInfoAtom)
  const httpEndpoint = useAtomValue(httpEndpointAtom)
  const isMainnet = useAtomValue(isMainnetAtom)
  const isTestnet = useAtomValue(isTestnetAtom)

  const changeNetwork = (url: string) => {
    const network = findNetworkByUrl(url)
    if (network) {
      setNetworkUrl(url)
      console.log(`🌐 ネットワーク変更: ${network.name} (${network.type})`)
      return network
    }
    console.warn(`⚠️ 無効なネットワークURL: ${url}`)
    return null
  }

  return {
    networkUrl,
    networkInfo,
    changeNetwork,
    httpEndpoint,
    isMainnet,
    isTestnet,
  }
}

export const useNetworkInfo = () => useAtomValue(currentNetworkInfoAtom)
export const useCurrentNetwork = () => useAtom(networkAtom)
export const useHttpEndpoint = () => useAtomValue(httpEndpointAtom)

export const useNetworkState = () => {
  const [networkUrl, setNetworkUrl] = useAtom(networkAtom)
  const networkInfo = useAtomValue(currentNetworkInfoAtom)

  return {
    networkUrl,
    networkInfo,
    setNetworkUrl,
    isMainnet: networkInfo.type === 'mainnet',
    isTestnet: networkInfo.type === 'testnet',
    httpEndpoint: networkInfo.httpEndpoint,
  }
}

export const useNetworkOptions = () => {
  const options = useAtomValue(networkOptionsAtom)

  return {
    options,
    isLoading: false,
    error: null,
  }
}

export const useNetworkStatus = () => {
  const networkUrl = useAtomValue(networkAtom)
  const status = useAtomValue(currentNetworkStatusAtom)
  const [, fetchStatus] = useAtom(fetchNetworkStatusAtom)

  const refresh = () => {
    fetchStatus(networkUrl)
  }

  const shouldRefresh = !status || Date.now() - status.lastUpdated > 30000

  if (shouldRefresh) {
    setTimeout(() => refresh(), 0)
  }

  return {
    status,
    isLoading: !status,
    error: status?.error,
    refresh,
  }
}

export const useNetworkActions = () => {
  const setNetworkUrl = useSetAtom(networkAtom)

  const switchToMainnet = () => setNetworkUrl(NETWORK_CONFIGS.MAINNET.url)
  const switchToTestnet = () => setNetworkUrl(NETWORK_CONFIGS.TESTNET.url)
  const switchToDevnet = () => setNetworkUrl(NETWORK_CONFIGS.DEVNET.url)
  const switchToXahau = () => setNetworkUrl(NETWORK_CONFIGS.XAHAU.url)

  return {
    switchToMainnet,
    switchToTestnet,
    switchToDevnet,
    switchToXahau,
  }
}

// ===== ネットワーク選択UIコンポーネント =====

export const Network = () => {
  useHydrateAtoms([[networkAtom, NETWORK_CONFIGS.MAINNET.url]])
  const { networkInfo, changeNetwork } = useNetwork()
  const { options } = useNetworkOptions()
  const { status, isLoading: statusLoading } = useNetworkStatus()
  const { switchToMainnet, switchToTestnet, switchToXahau } = useNetworkActions()

  return (
    <div className='dropdown dropdown-center'>
      <button
        tabIndex={0}
        className='btn btn-ghost btn-square bg-base-200/50 tooltip tooltip-bottom'
        data-tip={`現在: ${networkInfo.description} ${
          statusLoading ? '⏳' : status?.online ? '🟢 オンライン' : '🔴 オフライン'
        }${status?.serverInfo ? ` | Fee: ${status.serverInfo.fee} XRP` : ''}`}
      >
        <div className='flex items-center justify-center relative'>
          <img src='/assets/xrpl-logo.png' alt='logo' width={36} height={36} />
          <span className='absolute -bottom-1 -right-1 text-xs'>{networkInfo.emoji}</span>
          {statusLoading ? (
            <span className='absolute -top-1 -right-1 loading loading-spinner loading-xs'></span>
          ) : status ? (
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                status.online ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
          ) : null}
        </div>
      </button>

      <ul
        tabIndex={0}
        className='dropdown-content menu bg-base-100/95 backdrop-blur-sm rounded-box shadow-lg border border-base-300 z-50 w-80 max-w-sm p-2'
      >
        {/* クイックアクション */}
        <li className='menu-title'>
          <span>クイック切り替え</span>
        </li>
        <li>
          <button onClick={switchToMainnet} className={`text-sm ${networkInfo.type === 'mainnet' ? 'active' : ''}`}>
            🌏 Mainnet
          </button>
        </li>
        <li>
          <button onClick={switchToTestnet} className={`text-sm ${networkInfo.type === 'testnet' ? 'active' : ''}`}>
            🔑 Testnet
          </button>
        </li>
        <li>
          <button onClick={switchToXahau} className={`text-sm ${networkInfo.type === 'xahau' ? 'active' : ''}`}>
            🍕 Xahau
          </button>
        </li>

        <div className='divider my-1'></div>

        {/* 詳細ネットワーク一覧 */}
        <li className='menu-title'>
          <span>すべてのネットワーク</span>
        </li>
        {options.map((option) => (
          <li key={option.value}>
            <button
              onClick={() => changeNetwork(option.value)}
              className={`flex items-center gap-2 text-sm ${networkInfo.url === option.value ? 'active' : ''}`}
            >
              <span>{option.network.emoji}</span>
              <span className='flex-1 truncate'>{option.network.name}</span>
              {option.network.type !== 'mainnet' && (
                <span
                  className={`badge badge-xs ${
                    option.network.type === 'testnet'
                      ? 'badge-warning'
                      : option.network.type === 'devnet'
                        ? 'badge-info'
                        : 'badge-secondary'
                  }`}
                >
                  {option.network.type}
                </span>
              )}
            </button>
          </li>
        ))}

        {/* ネットワーク状態情報 */}
        {status?.serverInfo && (
          <>
            <div className='divider my-1'></div>
            <li className='menu-title'>
              <span>ネットワーク情報</span>
            </li>
            <li className='text-xs opacity-70 p-2'>
              <div>📊 レジャー: #{status.serverInfo.ledgerVersion}</div>
              <div>💰 基本手数料: {status.serverInfo.fee} XRP</div>
              <div>⚡ 現在手数料: {status.serverInfo.openLedgerFee} XRP</div>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
