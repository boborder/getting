// 🎯 XRPL関連コンポーネントの統一エクスポート（分割版）

// ===== XRPL ユーティリティ関数とフック（統合版） =====
export {
  // 型定義
  type AccountFormData,
  // バリデーション
  AccountFormSchema,
  defaultAddressAtom,
  favoriteAddressesAtom,
  fetchAccountInfo,
  fetchAccountLines,
  fetchAccountNFTs,
  fetchAccountTx,
  fetchXRPLAccountData,
  fetchXRPLBalance,
  fetchXRPLFee,
  fetchXRPPrice,
  formatAccountStatus,
  // フォーマット関数
  formatXRPBalance,
  getNetworkBadgeClass,
  // API関数
  makeXRPLRequest,
  truncateAddress,
  useXRPLAccountData,
  useXRPLBalance,
  useXRPLFee,
  // カスタムフック
  useXRPLPrice,
  type XRPLAccountData,
  type XRPLBalanceData,
  type XRPLFeeData,
  type XRPLPriceData,
  xrplAccountDataAtom,
  xrplBalanceAtom,
  xrplFeeAtom,
  // Jotai Atoms
  xrplPriceAtom,
} from '~/utils/xrpl'
// ===== Fetch RPC系 =====
export {
  // データ取得コンポーネント
  Fetch,
} from './FetchRpc'
// ===== ネットワーク共有部分 =====
export {
  currentNetworkInfoAtom,
  currentNetworkStatusAtom,
  fetchNetworkStatusAtom,
  findNetworkByType,
  findNetworkByUrl,
  httpEndpointAtom,
  isMainnetAtom,
  isTestnetAtom,
  // ネットワーク設定
  NETWORK_CONFIGS,
  NETWORK_LIST,
  // ネットワーク選択UIコンポーネント
  Network,
  // 型定義
  type NetworkInfo,
  // 共有Atoms
  networkAtom,
  networkOptionsAtom,
  networkStatusAtom,
  useCurrentNetwork,
  useHttpEndpoint,
  // ネットワーク管理フック
  useNetwork,
  useNetworkActions,
  useNetworkInfo,
  useNetworkOptions,
  useNetworkState,
  useNetworkStatus,
} from './Networks'

// ===== XRPL.js系 =====
export {
  // クライアント管理フック
  useXrplClient,
} from './XrplClient'
// ===== XUMM認証系 =====
export {
  Payload,
  // XUMM認証コンポーネント
  Xaman,
} from './XummAuth'
