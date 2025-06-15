// 🎯 XRPL関連コンポーネントの統一エクスポート（分割版）

// ===== ネットワーク共有部分 =====
export {
  // 型定義
  type NetworkInfo,
  // ネットワーク設定
  NETWORK_CONFIGS,
  NETWORK_LIST,
  findNetworkByUrl,
  findNetworkByType,
  // ネットワーク管理フック
  useNetwork,
  useNetworkInfo,
  useCurrentNetwork,
  useHttpEndpoint,
  useNetworkState,
  useNetworkOptions,
  useNetworkStatus,
  useNetworkActions,
  // ネットワーク選択UIコンポーネント
  Network,
  // 共有Atoms
  networkAtom,
  currentNetworkInfoAtom,
  httpEndpointAtom,
  isMainnetAtom,
  isTestnetAtom,
  networkOptionsAtom,
  networkStatusAtom,
  currentNetworkStatusAtom,
  fetchNetworkStatusAtom,
} from './NetworkShared'

// ===== XUMM認証系 =====
export {
  // XUMM認証コンポーネント
  Xaman,
  Payload,
} from './XummAuth'

// ===== Fetch RPC系 =====
export {
  // データ取得コンポーネント
  Fetch,
} from './FetchRpc'

// ===== XRPL.js系 =====
export {
  // クライアント管理フック
  useXrplClient,
} from './XrplClient'

// ===== XRPL ユーティリティ関数とフック（統合版） =====
export {
  // 型定義
  type AccountFormData,
  type XRPLAccountData,
  type XRPLPriceData,
  type XRPLFeeData,
  type XRPLBalanceData,
  // バリデーション
  AccountFormSchema,
  // フォーマット関数
  formatXRPBalance,
  formatAccountStatus,
  getNetworkBadgeClass,
  truncateAddress,
  // API関数
  makeXRPLRequest,
  fetchAccountInfo,
  fetchAccountTx,
  fetchAccountNFTs,
  fetchAccountLines,
  fetchXRPLAccountData,
  fetchXRPPrice,
  fetchXRPLFee,
  fetchXRPLBalance,
  // カスタムフック
  useXRPLPrice,
  useXRPLFee,
  useXRPLBalance,
  useXRPLAccountData,
  // Jotai Atoms
  xrplPriceAtom,
  xrplFeeAtom,
  xrplBalanceAtom,
  xrplAccountDataAtom,
  defaultAddressAtom,
  favoriteAddressesAtom,
} from '~/utils/xrpl'
