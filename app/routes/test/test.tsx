import { Form, data, useActionData, useLoaderData } from 'react-router'
import {
  type AccountInfoResponse,
  Client,
  type Transaction,
  type TxResponse,
  Wallet,
  convertStringToHex,
  getBalanceChanges,
  xrpToDrops,
} from 'xrpl'
import type { Route } from './+types/test'

import { Alert } from '~/components/ui/Alert'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { Collapse } from '~/components/ui/Collapse'

// ウォレット情報の型定義
interface WalletInfo {
  address: string
  classicAddress: string
  seed: string | undefined
  publicKey: string
  privateKey: string
}

interface SuccessActionData {
  success: true
  actionType: string
  wallet?: WalletInfo
  accountInfo?: any
  message?: string
  transaction?: string
  transactionResult?: string
  balanceChanges?: string
  cid?: string
}

interface ErrorActionData {
  success: false
  error: string
}

type ActionData = SuccessActionData | ErrorActionData

// 🚀 SSR Loader
export async function loader({ request }: Route.LoaderArgs) {
  try {
    // URLパラメータからウォレット情報を取得
    const url = new URL(request.url)
    const walletParam = url.searchParams.get('wallet')
    const accountInfoParam = url.searchParams.get('accountInfo')
    const messageParam = url.searchParams.get('message')

    let walletInfo = null
    let accountInfo = null
    let message = null

    if (walletParam) {
      try {
        walletInfo = JSON.parse(walletParam)
      } catch (e) {
        console.warn('Failed to parse wallet param:', e)
      }
    }

    if (accountInfoParam) {
      try {
        accountInfo = JSON.parse(accountInfoParam)
      } catch (e) {
        console.warn('Failed to parse accountInfo param:', e)
      }
    }

    if (messageParam) {
      message = messageParam
    }

    return {
      serverTime: new Date().toISOString(),
      wallet: walletInfo,
      accountInfo: accountInfo,
      message: message,
    }
  } catch (error) {
    console.warn('Test loader error:', error)
    return {
      serverTime: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      wallet: null,
      accountInfo: null,
      message: null,
    }
  }
}

// 🎯 Action関数 - トランザクション処理のみ
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const actionType = formData.get('actionType') as string

  console.log('🔍 Transaction Action called:', actionType)

  try {
    const ws = 'wss://testnet.xrpl-labs.com'
    const client = new Client(ws)

    switch (actionType) {
      case 'transfer': {
        const seed = formData.get('walletSeed') as string
        const amount = formData.get('amount') as string
        const destination = formData.get('destination') as string

        console.log('💸 Transfer:', { amount, destination })

        if (!seed || !amount || !destination) {
          throw new Error('必要な情報が入力されていません')
        }

        if (!client.isConnected()) await client.connect()

        const wallet = Wallet.fromSeed(seed)

        const txForm: Transaction = await client.autofill({
          TransactionType: 'Payment',
          Account: wallet.address,
          Amount: xrpToDrops(amount),
          Destination: destination,
        })

        const signed = wallet.sign(txForm)
        const tx: TxResponse = await client.submitAndWait(signed.tx_blob)

        let changeData: string | undefined
        let stats: string | undefined
        if (tx.result.meta !== undefined && typeof tx.result.meta !== 'string') {
          changeData = JSON.stringify(getBalanceChanges(tx.result.meta), null, 2)
          stats = tx.result.meta.TransactionResult
        }

        const info: AccountInfoResponse = await client.request({
          command: 'account_info',
          account: wallet.address,
        })

        await client.disconnect()

        return data({
          success: true,
          actionType: 'transfer',
          transaction: JSON.stringify(tx.result),
          balanceChanges: changeData,
          transactionResult: stats,
          accountInfo: info.result,
          message: `${amount} XRPを${destination}に送金しました`,
        })
      }

      case 'didSet': {
        const seed = formData.get('walletSeed') as string
        const didData = formData.get('data') as string

        if (!seed || !didData) {
          throw new Error('必要な情報が入力されていません')
        }

        if (!client.isConnected()) await client.connect()

        const wallet = Wallet.fromSeed(seed)
        const dataHex = convertStringToHex(didData)

        const id = `did:xrpl:0:${wallet.address}`
        const document = {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: id,
          publicKey: [
            {
              id: id,
              type: 'Secp256k1VerificationKey2018',
              controller: id,
              publicKeyHex: convertStringToHex(id),
            },
          ],
          assertionMethod: [id],
          authentication: [id],
        }

        try {
          const text = JSON.stringify(document)
          const blob = new Blob([text], { type: 'application/json' })
          const formDataForPinata = new FormData()
          formDataForPinata.append('file', blob, 'document.json')

          const res = await fetch('/api/pinata', {
            method: 'POST',
            body: formDataForPinata,
          })

          const cid = await res.json()
          const uri = convertStringToHex('ipfs:' + cid)

          const txForm: Transaction = await client.autofill({
            TransactionType: 'DIDSet',
            Account: wallet.address,
            URI: convertStringToHex(uri),
            Data: dataHex,
          })

          const signed = wallet.sign(txForm)
          const tx: TxResponse = await client.submitAndWait(signed.tx_blob)

          let stats: string | undefined
          if (tx.result.meta !== undefined && typeof tx.result.meta !== 'string') {
            stats = tx.result.meta.TransactionResult
          }

          const info: AccountInfoResponse = await client.request({
            command: 'account_info',
            account: wallet.address,
          })

          await client.disconnect()

          return data({
            success: true,
            actionType: 'didSet',
            transaction: JSON.stringify(tx.result),
            transactionResult: stats,
            accountInfo: info.result,
            cid,
            message: 'DIDを設定しました',
          })
        } catch {
          await client.disconnect()
          throw new Error('ドキュメントのアップロードに失敗しました')
        }
      }

      case 'setRegularKey': {
        const seed = formData.get('walletSeed') as string
        const regularKey = formData.get('key') as string

        if (!seed) {
          throw new Error('ウォレットのシードが必要です')
        }

        if (!client.isConnected()) await client.connect()

        const wallet = Wallet.fromSeed(seed)

        const txForm: Transaction = await client.autofill({
          TransactionType: 'SetRegularKey',
          Account: wallet.classicAddress,
          RegularKey: regularKey || 'r44444Q525rRY3hiwgwjP9zN1R8Z8QQ7oc',
        })

        const signed = wallet.sign(txForm)
        const tx: TxResponse = await client.submitAndWait(signed.tx_blob)

        let stats: string | undefined
        if (tx.result.meta !== undefined && typeof tx.result.meta !== 'string') {
          stats = tx.result.meta.TransactionResult
        }

        // レギュラーキーでのテスト送金
        const regWallet = Wallet.fromSeed('sEdVc2eVRWWzCSpe8UuxJHuuQa1yQDP')

        const testTx: Transaction = await client.autofill({
          TransactionType: 'Payment',
          Account: wallet.address,
          Amount: '12345678',
          Destination: 'r44444Q525rRY3hiwgwjP9zN1R8Z8QQ7oc',
        })

        const signedTest = regWallet.sign(testTx)
        const submitResult: TxResponse = await client.submitAndWait(signedTest.tx_blob, { wallet: regWallet })

        if (submitResult.result.meta !== undefined && typeof submitResult.result.meta !== 'string') {
          stats = submitResult.result.meta.TransactionResult
        }

        const info: AccountInfoResponse = await client.request({
          command: 'account_info',
          account: wallet.address,
        })

        await client.disconnect()

        return data({
          success: true,
          actionType: 'setRegularKey',
          transaction: JSON.stringify(submitResult.result),
          transactionResult: stats,
          accountInfo: info.result,
          message: 'レギュラーキーを設定しました',
        })
      }

      default:
        throw new Error('無効なアクションタイプです')
    }
  } catch (error) {
    console.error('❌ Transaction Action error:', error)
    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      },
      { status: 500 },
    )
  }
}

export default function Test({ loaderData }: Route.ComponentProps) {
  const { wallet: loaderWallet, accountInfo: loaderAccountInfo, message: loaderMessage } = loaderData
  const actionData = useActionData<typeof action>() as ActionData | undefined

  console.log('🔍 Component render:', { actionData, loaderWallet })

  // 型ガード関数
  const isSuccessActionData = (data: ActionData | undefined): data is SuccessActionData => {
    return data !== undefined && data.success === true
  }

  const isErrorActionData = (data: ActionData | undefined): data is ErrorActionData => {
    return data !== undefined && data.success === false
  }

  // ウォレット情報の優先順位: actionData > loaderData
  const currentWallet = (isSuccessActionData(actionData) && actionData.wallet) || loaderWallet
  const currentAccountInfo = (isSuccessActionData(actionData) && actionData.accountInfo) || loaderAccountInfo
  const currentMessage = (isSuccessActionData(actionData) && actionData.message) || loaderMessage

  console.log('🔍 Current wallet:', currentWallet)

  return (
    <>
      <Card>
        <CardBody>
          <CardTitle>🧪 XRPLテストネット実験室</CardTitle>
        </CardBody>
      </Card>

      {/* デバッグ情報 */}
      {(actionData || loaderWallet) && (
        <Card>
          <CardBody>
            <CardTitle size='sm'>🔍 デバッグ情報</CardTitle>
            <div className='space-y-2'>
              {actionData && <Collapse title='Action Data' content={JSON.stringify(actionData, null, 2)} />}
              {loaderWallet && <Collapse title='Loader Wallet' content={JSON.stringify(loaderWallet, null, 2)} />}
            </div>
          </CardBody>
        </Card>
      )}

      {/* エラー表示 */}
      {isErrorActionData(actionData) && (
        <Alert variant='error' title='エラーが発生しました'>
          {actionData.error}
        </Alert>
      )}

      {/* 成功メッセージ */}
      {currentMessage && (
        <Alert variant='success' title='操作完了'>
          {currentMessage}
        </Alert>
      )}

      {/* ウォレット作成・取得セクション */}
      {!currentWallet && (
        <div className='space-y-4'>
          <Card>
            <CardBody>
              <CardTitle size='sm'>🔑 ウォレットが必要です</CardTitle>
              <p className='text-sm mb-4'>XRPLテストネット実験を開始するには、まずウォレットを設定してください。</p>
              <a href='/test/wallet' className='btn btn-primary w-full'>
                ウォレット設定ページへ
              </a>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ウォレット情報表示 */}
      {currentWallet && (
        <Card>
          <CardBody>
            <div className='flex justify-between items-start mb-4'>
              <CardTitle>💼 ウォレット情報</CardTitle>
              <a href='/test/wallet' className='btn btn-outline btn-sm'>
                ウォレット変更
              </a>
            </div>
            <div className='flex flex-col gap-2'>
              <span>アドレス:</span>
              <p className='text-primary text-sm font-mono break-all'>{currentWallet.classicAddress}</p>
              <span>シード:</span>
              <p className='text-primary text-sm font-mono break-all'>{currentWallet.seed}</p>
              {currentAccountInfo && (
                <Collapse
                  title={`${(Number(currentAccountInfo.account_data.Balance) / 1000000).toFixed(6)} XRP`}
                  content={currentAccountInfo}
                />
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* トランザクション操作セクション */}
      {currentWallet && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* XRP送金 */}
          <Card>
            <CardBody>
              <CardTitle size='sm'>💸 XRP送金</CardTitle>
              <Form method='post' className='space-y-3'>
                <input type='hidden' name='actionType' value='transfer' />
                <input type='hidden' name='walletSeed' value={currentWallet.seed} />
                <input
                  type='text'
                  name='destination'
                  placeholder='送金先アドレス (r...)'
                  className='input input-bordered w-full'
                  required
                />
                <input
                  type='number'
                  name='amount'
                  placeholder='送金額 (XRP)'
                  step='0.000001'
                  min='0.000001'
                  className='input input-bordered w-full'
                  required
                />
                <button type='submit' className='btn btn-warning w-full'>
                  送金実行
                </button>
              </Form>
            </CardBody>
          </Card>

          {/* DID設定 */}
          <Card>
            <CardBody>
              <CardTitle size='sm'>🆔 DID設定</CardTitle>
              <Form method='post' className='space-y-3'>
                <input type='hidden' name='actionType' value='didSet' />
                <input type='hidden' name='walletSeed' value={currentWallet.seed} />
                <input
                  type='text'
                  name='data'
                  placeholder='DIDデータ'
                  className='input input-bordered w-full'
                  required
                />
                <button type='submit' className='btn btn-info w-full'>
                  DID設定
                </button>
              </Form>
            </CardBody>
          </Card>

          {/* レギュラーキー設定 */}
          <Card>
            <CardBody>
              <CardTitle size='sm'>🔐 レギュラーキー設定</CardTitle>
              <Form method='post' className='space-y-3'>
                <input type='hidden' name='actionType' value='setRegularKey' />
                <input type='hidden' name='walletSeed' value={currentWallet.seed} />
                <input
                  type='text'
                  name='key'
                  placeholder='レギュラーキーアドレス (r...)'
                  defaultValue='r44444Q525rRY3hiwgwjP9zN1R8Z8QQ7oc'
                  className='input input-bordered w-full'
                />
                <button type='submit' className='btn btn-accent w-full'>
                  レギュラーキー設定
                </button>
              </Form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* トランザクション結果表示 */}
      {isSuccessActionData(actionData) && actionData.transaction && (
        <Card>
          <CardBody>
            <CardTitle>📊 トランザクション結果</CardTitle>
            <Collapse title={`${actionData.transactionResult || '処理完了'}`} content={actionData.transaction} />
            {actionData.balanceChanges && <Collapse title='残高変更' content={actionData.balanceChanges} />}
          </CardBody>
        </Card>
      )}
    </>
  )
}
