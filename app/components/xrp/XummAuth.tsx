import { atom, useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { type AccountTxTransaction, convertStringToHex } from 'xrpl'
import type { XummGetPayloadResponse } from 'xumm-sdk/dist/src/types'
import { Collapse } from '~/components/ui/Collapse'
import { getTx } from '~/utils/dig'
import { useUser } from '~/utils/xumm'
import { NETWORK_CONFIGS, networkAtom, useNetworkInfo, useNetworkStatus } from './NetworkShared'

// ===== XUMM認証関連のAtoms =====

const qrCodeAtom = atom<string | undefined>(undefined)
const payloadUuidAtom = atom<string | undefined>(undefined)
const payloadResponseAtom = atom<XummGetPayloadResponse | null | undefined>(undefined)
const transactionDataAtom = atom<AccountTxTransaction | undefined>(undefined)

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

// ===== Payloadコンポーネント（元のPayload.tsxのUIを完璧に保持） =====

export const Payload = () => {
  const { xumm, user } = useUser()
  useHydrateAtoms([
    [qrCodeAtom, undefined],
    [payloadUuidAtom, undefined],
    [payloadResponseAtom, undefined],
    [transactionDataAtom, undefined],
  ])
  const [qr, setQr] = useAtom(qrCodeAtom)
  const [uuid, setUuid] = useAtom(payloadUuidAtom)
  const [tx, setTx] = useAtom(payloadResponseAtom)
  const [txData, setData] = useAtom(transactionDataAtom)

  const createPayload = async () => {
    const payload = await xumm?.payload?.create({
      TransactionType: 'Payment',
      Destination: 'rQqqqqJyn6sKBzByJynmEK3psndQeoWdP',
      Fee: 589,
      Memos: [
        {
          Memo: {
            MemoType: convertStringToHex('Payment'),
            MemoFormat: convertStringToHex('text/plain'),
            MemoData: convertStringToHex('Donate with Xaman'),
          },
        },
      ],
    })
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
        const tx = await getTx(user?.account!, user?.networkEndpoint!, 'Payment')
        if (tx) {
          setData(tx)
        }
      }
    }, 10000)
  }

  return (
    <>
      {qr || tx ? (
        <>
          {qr && (
            <div className='stat'>
              <img src={qr} alt='QR' height={150} width={150} className='mx-auto w-full' />
            </div>
          )}

          {tx && <Collapse title={tx.response.resolved_at || undefined} content={txData || tx.response} />}
        </>
      ) : (
        <>
          {user ? (
            <div className='stat'>
              <div className='stat-title'>Donate</div>
              <div className='stat-actions'>
                <img
                  src={'/assets/donate-with-xumm.png'}
                  width={240}
                  height={100}
                  alt='donate'
                  onMouseDown={async () => {
                    await createPayload()
                    console.log('donate')
                  }}
                  className='cursor-pointer'
                />
              </div>
              <div className='stat-desc'>Donate with Xumm</div>
            </div>
          ) : (
            <Xaman />
          )}
        </>
      )}
    </>
  )
}
