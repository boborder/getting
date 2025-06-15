import { Form, useActionData } from 'react-router'
import type { Route } from './+types/wallet'

import { useState } from 'react'
import { type AccountInfoResponse, Client, Wallet } from 'xrpl'
import { Alert } from '~/components/ui/Alert'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'

// ウォレット情報の型定義
interface WalletInfo {
  address: string
  classicAddress: string
  seed: string | undefined
  publicKey: string
  privateKey: string
}

export default function WalletSetup() {
  const [isCreating, setIsCreating] = useState(false)
  const [isGetting, setIsGetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWallet = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const ws = 'wss://testnet.xrpl-labs.com'
      const client = new Client(ws)

      console.log('🆕 Creating new account...')

      if (!client.isConnected()) {
        console.log('🔌 Connecting to XRPL...')
        await client.connect()
      }

      console.log('💰 Funding wallet...')
      const fundResult = await client.fundWallet()
      const newWallet = fundResult?.wallet

      if (!newWallet) {
        throw new Error('ウォレットの作成に失敗しました')
      }

      console.log('✅ Wallet created:', newWallet.classicAddress)

      const info: AccountInfoResponse = await client.request({
        command: 'account_info',
        account: newWallet.address,
      })

      await client.disconnect()
      console.log('🔌 Disconnected from XRPL')

      const walletInfo: WalletInfo = {
        address: newWallet.address,
        classicAddress: newWallet.classicAddress,
        seed: newWallet.seed,
        publicKey: newWallet.publicKey,
        privateKey: newWallet.privateKey,
      }

      // ウォレット情報をURLパラメータでテストページに送信
      const url = new URL('/test', window.location.origin)
      url.searchParams.set('wallet', JSON.stringify(walletInfo))
      url.searchParams.set('accountInfo', JSON.stringify(info.result))
      url.searchParams.set('message', '新しいウォレットを作成しました')

      window.location.href = url.toString()
    } catch (error) {
      console.error('❌ Wallet creation error:', error)
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setIsCreating(false)
    }
  }

  const getWallet = async (seed: string) => {
    setIsGetting(true)
    setError(null)

    try {
      const ws = 'wss://testnet.xrpl-labs.com'
      const client = new Client(ws)

      console.log('🔑 Getting wallet from seed...')

      if (!seed) {
        throw new Error('シードが入力されていません')
      }

      if (!client.isConnected()) {
        console.log('🔌 Connecting to XRPL...')
        await client.connect()
      }

      console.log('🔍 Creating wallet from seed...')
      const myWallet = Wallet.fromSeed(seed)

      console.log('📊 Getting account info for:', myWallet.classicAddress)
      const info: AccountInfoResponse = await client.request({
        command: 'account_info',
        account: myWallet.classicAddress,
      })

      await client.disconnect()
      console.log('🔌 Disconnected from XRPL')

      const walletInfo: WalletInfo = {
        address: myWallet.address,
        classicAddress: myWallet.classicAddress,
        seed: myWallet.seed,
        publicKey: myWallet.publicKey,
        privateKey: myWallet.privateKey,
      }

      // ウォレット情報をURLパラメータでテストページに送信
      const url = new URL('/test', window.location.origin)
      url.searchParams.set('wallet', JSON.stringify(walletInfo))
      url.searchParams.set('accountInfo', JSON.stringify(info.result))
      url.searchParams.set('message', '既存のウォレットを取得しました')

      window.location.href = url.toString()
    } catch (error) {
      console.error('❌ Wallet get error:', error)
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setIsGetting(false)
    }
  }

  const handleGetWallet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const seed = formData.get('seed') as string
    getWallet(seed)
  }

  return (
    <>
      <Card>
        <CardBody>
          <CardTitle>🔑 ウォレット設定</CardTitle>
          <p className='text-sm opacity-75'>XRPLテストネット用のウォレットを作成または復元します</p>
        </CardBody>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant='error' title='エラーが発生しました'>
          {error}
        </Alert>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <Card>
          <CardBody>
            <CardTitle size='sm'>🆕 新しいウォレットを作成</CardTitle>
            <p className='text-sm mb-4'>
              新しいキーペアを作成し、
              <br />
              テストネットの残高を取得します。
            </p>
            <button type='button' onClick={createWallet} disabled={isCreating} className='btn btn-primary w-full'>
              {isCreating ? (
                <>
                  <span className='loading loading-spinner loading-sm'></span>
                  作成中...
                </>
              ) : (
                'ウォレット作成'
              )}
            </button>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle size='sm'>🔑 既存ウォレットから取得</CardTitle>
            <p className='text-sm mb-4'>
              シード（s...）を入力して
              <br />
              既存のアカウント（r...）を取得
            </p>
            <form onSubmit={handleGetWallet} className='space-y-3'>
              <input
                type='text'
                name='seed'
                placeholder='シードを入力 (s...)'
                defaultValue='sEdTmb26Y6aC6d447UVknAULKqKYfDE'
                className='input input-bordered w-full'
                required
                disabled={isGetting}
              />
              <button type='submit' disabled={isGetting} className='btn btn-secondary w-full'>
                {isGetting ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    取得中...
                  </>
                ) : (
                  'ウォレット取得'
                )}
              </button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className='text-center'>
        <a href='/test' className='btn btn-outline'>
          ← テストページに戻る
        </a>
      </div>
    </>
  )
}
