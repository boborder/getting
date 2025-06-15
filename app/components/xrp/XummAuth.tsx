import { atom, useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { type AccountTxTransaction, convertStringToHex } from 'xrpl'
import type { XummGetPayloadResponse } from 'xumm-sdk/dist/src/types'
import { Collapse } from '~/components/ui/Collapse'
import { getTx } from '~/utils/dig'
import { useUser } from '~/utils/xumm'
import { NETWORK_CONFIGS, networkAtom, useNetworkInfo, useNetworkStatus } from './Networks'

// ===== XUMM認証関連のAtoms =====

const qrCodeAtom = atom<string | undefined>(undefined)
const payloadUuidAtom = atom<string | undefined>(undefined)
const payloadResponseAtom = atom<XummGetPayloadResponse | null | undefined>(undefined)
const transactionDataAtom = atom<AccountTxTransaction | undefined>(undefined)
const selectedTxTypeAtom = atom<string>('SignIn')

// ===== トランザクションタイプ定義 =====

interface TransactionTemplate {
  type: string
  name: string
  description: string
  icon: string
  category: 'pseudo' | 'payment' | 'exchange' | 'trust' | 'advanced'
  payload: any
}

const TRANSACTION_TEMPLATES: TransactionTemplate[] = [
  // 擬似トランザクション
  {
    type: 'SignIn',
    name: 'サインイン',
    description: 'XUMM署名認証（送信されません）',
    icon: '🔐',
    category: 'pseudo',
    payload: { TransactionType: 'SignIn' },
  },
  {
    type: 'PaymentChannelAuthorize',
    name: 'ペイメントチャネル認証',
    description: 'チャネル支払い認証',
    icon: '🏦',
    category: 'pseudo',
    payload: {
      TransactionType: 'PaymentChannelAuthorize',
      Channel: '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3',
      Amount: '1000000',
    },
  },

  // 支払い系
  {
    type: 'Payment',
    name: 'XRP送金',
    description: 'XRP支払いトランザクション',
    icon: '💸',
    category: 'payment',
    payload: {
      TransactionType: 'Payment',
      Destination: 'rQqqqqJyn6sKBzByJynmEK3psndQeoWdP',
      Amount: '1000000',
      Fee: '589',
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('Payment'),
            MemoFormat: convertStringToHex('text/plain'),
            MemoData: convertStringToHex('Sample XRP Payment'),
          },
        },
      ],
    },
  },
  {
    type: 'PaymentToken',
    name: 'トークン送金',
    description: 'IOU/トークン支払い',
    icon: '🪙',
    category: 'payment',
    payload: {
      TransactionType: 'Payment',
      Destination: 'rQqqqqJyn6sKBzByJynmEK3psndQeoWdP',
      Amount: {
        currency: 'USD',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
        value: '10',
      },
      Fee: '589',
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('TokenPayment'),
            MemoData: convertStringToHex('Sample Token Payment'),
          },
        },
      ],
    },
  },

  // 取引所系
  {
    type: 'OfferCreate',
    name: 'オファー作成',
    description: 'DEX取引オファー',
    icon: '🔄',
    category: 'exchange',
    payload: {
      TransactionType: 'OfferCreate',
      TakerGets: '10000000',
      TakerPays: {
        currency: 'USD',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
        value: '10',
      },
      Fee: '589',
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('DEX_OFFER'),
            MemoData: convertStringToHex('Sample DEX Offer'),
          },
        },
      ],
    },
  },
  {
    type: 'OfferCancel',
    name: 'オファーキャンセル',
    description: 'DEXオファー取り消し',
    icon: '❌',
    category: 'exchange',
    payload: {
      TransactionType: 'OfferCancel',
      OfferSequence: 12345,
      Fee: '589',
    },
  },

  // Trust Line系
  {
    type: 'TrustSet',
    name: 'Trust Line設定',
    description: 'トークン信頼線作成',
    icon: '🤝',
    category: 'trust',
    payload: {
      TransactionType: 'TrustSet',
      LimitAmount: {
        currency: 'USD',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
        value: '1000000',
      },
      Fee: '589',
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('TRUST_SET'),
            MemoData: convertStringToHex('Create Trust Line'),
          },
        },
      ],
    },
  },

  // 高度な機能
  {
    type: 'EscrowCreate',
    name: 'エスクロー作成',
    description: '時限付きエスクロー',
    icon: '⏰',
    category: 'advanced',
    payload: {
      TransactionType: 'EscrowCreate',
      Destination: 'rQqqqqJyn6sKBzByJynmEK3psndQeoWdP',
      Amount: '1000000',
      FinishAfter: Math.floor(Date.now() / 1000) + 3600,
      Fee: '589',
    },
  },
  {
    type: 'CheckCreate',
    name: 'チェック作成',
    description: '支払いチェック作成',
    icon: '📋',
    category: 'advanced',
    payload: {
      TransactionType: 'CheckCreate',
      Destination: 'rQqqqqJyn6sKBzByJynmEK3psndQeoWdP',
      SendMax: '1000000',
      Fee: '589',
    },
  },
]

// ===== Xamanコンポーネント（元のXaman.tsxのUIを完璧に保持） =====

export const Xaman = () => {
  const { xumm, user } = useUser()
  useHydrateAtoms([[networkAtom, NETWORK_CONFIGS.MAINNET.url]])
  const networkInfo = useNetworkInfo()
  const { status, isLoading: statusLoading } = useNetworkStatus()

  return (
    <>
      <p className='text-accent flex items-center gap-2'>
        <span>{networkInfo.emoji}</span>
        <span>{networkInfo.name}</span>
        {networkInfo.type !== 'mainnet' && <span className='badge badge-warning badge-xs'>{networkInfo.type}</span>}
        {statusLoading ? (
          <span className='loading loading-spinner loading-xs'></span>
        ) : status ? (
          <span className={`badge badge-xs ${status.online ? 'badge-success' : 'badge-error'}`}>
            {status.online ? '🟢' : '🔴'}
          </span>
        ) : null}
      </p>
      {user ? (
        <>
          <button onMouseDown={async () => await xumm?.logout()} type='button'>
            Logout
          </button>
        </>
      ) : (
        <img
          src='/assets/sign-in-with-xumm.png'
          alt='xumm'
          height={56}
          width={256}
          onMouseDown={async () => {
            await xumm?.authorize()
          }}
          className='cursor-pointer'
        />
      )}
    </>
  )
}

// ===== 多機能Payloadコンポーネント =====

export const Payload = () => {
  const { xumm, user } = useUser()
  useHydrateAtoms([
    [qrCodeAtom, undefined],
    [payloadUuidAtom, undefined],
    [payloadResponseAtom, undefined],
    [transactionDataAtom, undefined],
    [selectedTxTypeAtom, 'SignIn'],
  ])
  const [qr, setQr] = useAtom(qrCodeAtom)
  const [uuid, setUuid] = useAtom(payloadUuidAtom)
  const [tx, setTx] = useAtom(payloadResponseAtom)
  const [txData, setData] = useAtom(transactionDataAtom)
  const [selectedTxType, setSelectedTxType] = useAtom(selectedTxTypeAtom)

  const selectedTemplate = TRANSACTION_TEMPLATES.find((t) => t.type === selectedTxType)

  const createPayload = async () => {
    if (!selectedTemplate) return null

    const payload = await xumm?.payload?.create(selectedTemplate.payload)

    if (!payload) {
      console.log('payload is not created')
      return null
    }

    if (xumm?.xapp) {
      await xumm.xapp?.openSignRequest(payload)
    } else {
      const message = payload.pushed
        ? `Payload '${payload.uuid}' pushed to your phone.`
        : 'Payload not pushed, opening payload...'
      alert(message)
      if (!payload.pushed) {
        window.open(payload.next.always)
      }
    }
    setQr(payload.refs.qr_png)
    setUuid(payload.uuid)
    handlePayloadStatus()
  }

  // payload を 10秒ごとに確認して resolved になったら 結果を取得
  const handlePayloadStatus = () => {
    const checkPayloadStatus = setInterval(async () => {
      if (!uuid) return null
      const status = await xumm?.payload?.get(uuid)
      setTx(status)
      if (status?.meta.resolved) {
        clearInterval(checkPayloadStatus)
        setTx(status)
        setQr(undefined)
        if (!status.meta.signed) {
          console.log('payload cancelled')
          return null
        }

        // 擬似トランザクションの場合は実際のトランザクション取得をスキップ
        if (selectedTemplate?.category === 'pseudo') {
          console.log('Pseudo transaction signed:', selectedTemplate.type)
          return null
        }

        const tx = await getTx(user?.account!, user?.networkEndpoint!, selectedTemplate?.type || 'Payment')
        if (tx) {
          setData(tx)
        }
      }
    }, 10000)
  }

  const categoryLabels = {
    pseudo: '🔐 擬似トランザクション',
    payment: '💸 支払い',
    exchange: '🔄 取引所',
    trust: '🤝 Trust Line',
    advanced: '⚡ 高度な機能',
  }

  const groupedTemplates = TRANSACTION_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    },
    {} as Record<string, TransactionTemplate[]>,
  )

  return (
    <>
      {qr || tx ? (
        <>
          {qr && (
            <div className='stat'>
              <div className='stat-title'>
                {selectedTemplate?.icon} {selectedTemplate?.name}
              </div>
              <img src={qr} alt='QR' height={150} width={150} className='mx-auto w-full' />
              <div className='stat-desc'>{selectedTemplate?.description}</div>
            </div>
          )}

          {tx && <Collapse title={tx.response.resolved_at || undefined} content={txData || tx.response} />}
        </>
      ) : (
        <>
          {user ? (
            <div className='space-y-4'>
              {/* トランザクションタイプ選択 */}
              <div className='card bg-base-200 shadow-lg'>
                <div className='card-body p-4'>
                  <h3 className='card-title text-lg'>🚀 トランザクションタイプ選択</h3>

                  {Object.entries(groupedTemplates).map(([category, templates]) => (
                    <div key={category} className='space-y-2'>
                      <h4 className='font-semibold text-sm opacity-80'>
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                        {templates.map((template) => (
                          <label key={template.type} className='cursor-pointer'>
                            <input
                              type='radio'
                              name='txType'
                              value={template.type}
                              checked={selectedTxType === template.type}
                              onChange={(e) => setSelectedTxType(e.target.value)}
                              className='radio radio-primary radio-sm mr-2'
                            />
                            <span className='text-sm'>
                              {template.icon} {template.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 選択されたトランザクションの詳細 */}
              {selectedTemplate && (
                <div className='card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20'>
                  <div className='card-body p-4'>
                    <h3 className='card-title text-lg'>
                      {selectedTemplate.icon} {selectedTemplate.name}
                    </h3>
                    <p className='text-sm opacity-80 mb-4'>{selectedTemplate.description}</p>

                    {/* ペイロード詳細表示 */}
                    <div className='bg-base-100 p-3 rounded-lg mb-4'>
                      <h4 className='font-semibold text-sm mb-2'>📋 ペイロード内容</h4>
                      <pre className='text-xs overflow-x-auto'>{JSON.stringify(selectedTemplate.payload, null, 2)}</pre>
                    </div>

                    {/* 実行ボタン */}
                    <button
                      type='button'
                      onClick={createPayload}
                      className='btn-primary btn-lg'
                    >
                      {selectedTemplate.icon} {selectedTemplate.name}を実行
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Xaman />
          )}
        </>
      )}
    </>
  )
}
