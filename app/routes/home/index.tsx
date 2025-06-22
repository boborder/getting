import { useForm } from '@conform-to/react'
import { parseWithValibot } from 'conform-to-valibot'
import { hc } from 'hono/client'
import { Suspense } from 'react'
import { Await, data, Form, useActionData, useLoaderData, useRevalidator } from 'react-router'
import { Wallet } from 'xrpl'

// Components
import { Alert } from '~/components/ui/Alert'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { Collapse } from '~/components/ui/Collapse'
import { Loading } from '~/components/ui/Loading'

import { Fetch, NETWORK_CONFIGS, Payload, useNetworkOptions } from '~/components/xrp'
// Utils
import { useStore } from '~/utils/useStore'
import { AccountFormSchema, fetchXRPLAccountData, truncateAddress, type XRPLAccountData } from '~/utils/xrpl'
import { useUser } from '~/utils/xumm'
import type { AppType } from '../../../server'
import type { Route } from './+types/index'
import { AccountDisplay } from './AccountDisplay'

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: 'みんな〜やってるか！' }, { name: 'description', content: matches[0].pathname }]
}

// 🚀 SSR Loader
export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      serverTime: new Date().toISOString(),
      defaultNetwork: NETWORK_CONFIGS.MAINNET.url,
      environment: typeof context?.cloudflare !== 'undefined' ? 'cloudflare' : 'node',
    }
  } catch (error) {
    console.warn('Home loader error:', error)
    return {
      serverTime: new Date().toISOString(),
      defaultNetwork: NETWORK_CONFIGS.MAINNET.url,
      environment: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// 🎯 Client Loader
export const clientLoader = async ({ serverLoader }: Route.ClientLoaderArgs) => {
  const serverData = await serverLoader()
  const client = hc<AppType>('/')
  const rpc = client.api.user
    .$get({
      query: {
        name: 'bob',
      },
    })
    .then((res) => res.json())
  return {
    ...serverData,
    wallet: Wallet.generate(),
    client: rpc,
  }
}

clientLoader.hydrate = true as const

// 🎯 Action関数
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithValibot(formData, { schema: AccountFormSchema })

  if (submission.status !== 'success') {
    return data({ lastResult: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }

  const { address, network } = submission.value

  try {
    console.log('🔍 XRPLアカウント情報取得開始:', address, '(' + network + ')')
    const accountData = await fetchXRPLAccountData(address, network)
    console.log('✅ 整形されたアカウントデータ:', accountData)

    return data({
      success: true,
      accountData,
      lastResult: submission.reply(),
    })
  } catch (error) {
    console.error('❌ XRPL API エラー:', error)
    return data(
      {
        lastResult: submission.reply({
          formErrors: [`アカウント情報の取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`],
        }),
      },
      { status: 500 },
    )
  }
}

export const HydrateFallback = () => {
  return <Loading />
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { client } = useLoaderData<typeof clientLoader>()
  const actionData = useActionData<typeof action>()
  const revalidator = useRevalidator()

  // 🔐 XUMMユーザー情報
  const { user } = useUser()

  // 🌐 ネットワーク選択肢
  const { options: networks, isLoading: networksLoading } = useNetworkOptions()
  const [preferences, updateLastUsedAddress] = useStore<{
    defaultAddress: string
    defaultNetwork: string
  }>({
    key: 'preferences',
    init: {
      defaultAddress: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      defaultNetwork: NETWORK_CONFIGS.MAINNET.url,
    },
    store: {
      onGet: () =>
        JSON.parse(localStorage.getItem('preferences') || 'null') || {
          defaultAddress: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
          defaultNetwork: NETWORK_CONFIGS.MAINNET.url,
        },
      onSet: (key, data) => localStorage.setItem(key as string, JSON.stringify(data)),
    },
  })

  // 📝 フォーム管理
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: AccountFormSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    defaultValue: {
      address: user?.account || preferences?.defaultAddress || 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      network: preferences?.defaultNetwork || NETWORK_CONFIGS.MAINNET.url,
    },
  })

  // アドレス入力の自動補完
  const setAddressValue = (address: string) => {
    const addressInput = document.getElementById(fields.address.id) as HTMLInputElement
    if (addressInput) {
      addressInput.value = address
      updateLastUsedAddress({
        defaultAddress: address,
        defaultNetwork: preferences?.defaultNetwork || NETWORK_CONFIGS.MAINNET.url,
      })
    }
  }

  // 型ガード
  const isSuccessResult = (data: any): data is { success: true; accountData: XRPLAccountData; lastResult: any } => {
    return data && 'success' in data && data.success === true && 'accountData' in data
  }

  return (
    <>
      <Fetch />
      <Payload />

      {/* 🎯 アカウント情報取得フォーム */}
      <Card size='sm' background='base-200' className='max-w-4xl mx-auto my-3'>
        <CardBody className='p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'>
            <CardTitle size='sm' className='text-sm sm:text-base lg:text-lg'>
              📊 XRPLアカウント情報取得
            </CardTitle>

            {/* XUMMログイン状態表示 */}
            {user ? (
              <div className='flex items-center gap-2 flex-wrap'>
                <div className='badge badge-success badge-xs sm:badge-sm'>
                  <span className='text-xs'>🔐 XUMM認証済み</span>
                </div>
                <div className='text-xs opacity-70 hidden sm:block truncate max-w-20 lg:max-w-32'>
                  {user.account ? truncateAddress(user.account) : 'アカウント不明'}
                </div>
              </div>
            ) : (
              <div className='badge badge-outline badge-xs sm:badge-sm'>
                <span className='text-xs'>📱 未認証</span>
              </div>
            )}
          </div>

          <Form method='post' id={form.id} onSubmit={form.onSubmit}>
            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
              {/* XRPLアドレス入力 */}
              <div className='form-control w-full'>
                <label className='label' htmlFor={fields.address.id}>
                  <span className='label-text text-xs sm:text-sm font-medium'>
                    XRPLアドレス
                    {user && <span className='ml-1 badge badge-primary badge-xs'>ログイン中</span>}
                  </span>
                  <span className='label-text-alt text-xs opacity-70'>rから始まる25-34文字</span>
                </label>
                <input
                  key={fields.address.key}
                  id={fields.address.id}
                  name={fields.address.name}
                  type='text'
                  placeholder='r...'
                  defaultValue={user?.account || preferences?.defaultAddress || 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'}
                  disabled={revalidator.state === 'loading'}
                />
                {fields.address.errors?.[0] && (
                  <div className='label'>
                    <span className='label-text-alt text-error text-xs'>{fields.address.errors[0]}</span>
                  </div>
                )}
              </div>

              {/* ネットワーク選択 */}
              <div className='form-control'>
                <label className='label' htmlFor={fields.network.id}>
                  <span className='label-text'>ネットワーク</span>
                </label>
                <select
                  key={fields.network.key}
                  id={fields.network.id}
                  name={fields.network.name}
                  defaultValue={preferences?.defaultNetwork || NETWORK_CONFIGS.MAINNET.url}
                  disabled={networksLoading || revalidator.state === 'loading'}
                >
                  {networksLoading ? (
                    <option>読み込み中...</option>
                  ) : (
                    networks.map((net) => (
                      <option key={net.value} value={net.value} title={net.description}>
                        {net.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* フォームエラー表示 */}
            {form.errors && form.errors.length > 0 && (
              <Alert variant='error' title='エラーが発生しました'>
                {form.errors[0]}
              </Alert>
            )}

            {/* アクションボタン */}
            <div className='my-3 flex flex-col sm:flex-row gap-2 justify-center'>
              <button type='submit' className='btn btn-primary' disabled={revalidator.state === 'loading'}>
                {revalidator.state === 'loading' ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    <span>取得中...</span>
                  </>
                ) : (
                  <span>🔍アカウント情報取得</span>
                )}
              </button>

              {/* サンプルアドレスボタン */}
              <button
                type='button'
                onClick={() => setAddressValue('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV')}
                className='btn-outline'
                disabled={revalidator.state === 'loading'}
              >
                <span>🎲サンプルアドレス</span>
              </button>

              {/* 生成ウォレットボタン */}
              {loaderData.wallet && (
                <button
                  type='button'
                  onClick={() => setAddressValue(loaderData.wallet.classicAddress)}
                  className='btn-outline btn-accent'
                  disabled={revalidator.state === 'loading'}
                >
                  <span>🎰生成ウォレット</span>
                </button>
              )}

              {/* XUMMアカウントボタン */}
              {user && (
                <button
                  type='button'
                  onClick={() => user.account && setAddressValue(user.account)}
                  className='btn-outline btn-info'
                  disabled={revalidator.state === 'loading'}
                >
                  <span>🔐 XUMMアカウント</span>
                </button>
              )}
            </div>
          </Form>
        </CardBody>
      </Card>

      {/* 🎯 成功時の結果表示 */}
      {isSuccessResult(actionData) && <AccountDisplay accountData={actionData.accountData} />}

      {/* 🔄 デバッグ・開発情報表示 */}
      <Suspense fallback={<Loading />}>
        <Await resolve={client}>
          {(data) => <Collapse title={`🎰 ${data.message}`} content={JSON.stringify(data, null, 2)} />}
        </Await>
      </Suspense>

      {loaderData.wallet && (
        <Collapse
          title={`🎲 ${truncateAddress(loaderData.wallet.classicAddress)}`}
          content={JSON.stringify(loaderData.wallet, null, 2)}
        />
      )}

      <button
        type='button'
        onClick={async () => await revalidator.revalidate()}
        className='btn btn-outline my-3'
        disabled={revalidator.state === 'loading'}
      >
        {revalidator.state === 'loading' ? (
          <span className='loading loading-spinner'>リロード中...</span>
        ) : (
          '🔄 リロード'
        )}
      </button>
    </>
  )
}
