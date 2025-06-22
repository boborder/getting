import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import { Xumm } from 'xumm'
import { dig } from './dig'
import { hash } from './hash'

type PromiseType<T> = T extends Promise<infer U> ? U : T

type XummUser = { [P in keyof Xumm['user']]: PromiseType<Xumm['user'][P]> }

// ユーザー情報を取得
export const getXummUser = async (xumm?: Xumm) => {
  if (!xumm) return null
  const user = xumm.user
  // console.log(user)
  return {
    account: await user?.account,
    name: await user?.name,
    domain: await user?.domain,
    picture: await user?.picture,
    networkEndpoint: await user?.networkEndpoint,
    networkId: await user?.networkId,
    networkType: await user?.networkType,
  }
}

  const getUser = (async (xumm: Xumm) => {
    const user = xumm.user
    const promisedUserArray = await Promise.all(
      (Object.keys(user) as (keyof typeof user)[]).map(async (u) => {
        return { [u]: await user[u] }
      }),
    )
    return Object.assign({}, ...promisedUserArray) as Promise<XummUser>
  })

// ユーザー情報を取得する キャッシュを利用 setUser をuseEffect で更新
export const useX = (API: string) => {
  // キーは API があるかどうか xumm
  const { data: xumm } = useSWRImmutable(API ? 'xumm' : null, () => new Xumm(API))
  // キーは xumm へログインしたか アドレス
  const { data: user, mutate: setUser } = useSWR(
    xumm?.user?.account ? xumm?.user?.account : null,
    async () => await getUser(xumm!),
  )
  // info がキー info と nft を取得
  useSWR(user?.account ? 'dig' : null, async () => await dig(user?.account!, user?.networkEndpoint, 'info', 'nft'))
  return { xumm, user, setUser }
}

// Context 的な使い方 cache を利用 上から順に依存
export const useUser = () => {
  // xumm がキー
  const { data: xumm } = useSWR<Xumm>('xumm')
  // address がキー
  const { data: user } = useSWR<XummUser>(xumm?.user?.account ? xumm?.user?.account : null)
  // info がキー info と nft を取得
  const { data } = useSWR<typeof dig>(user?.account ? 'dig' : null)
  return { xumm, user, data }
}

// ユーザーストアに値を設定
export const setStore = async (key: string, data: any) => {
  const { xumm, user } = useUser()
  if (!user) {
    console.log('xumm is not Signin')
    return null
  }
  const hashKey = await hash(key)
  await xumm?.userstore?.set(hashKey, data)
}

// ユーザーストアから値を取得
export const getStore = async (key: string) => {
  const { xumm, user } = useUser()
  if (!user) {
    console.log('xumm is not Signin')
    return null
  }
  const hashKey = await hash(key)
  return await xumm?.userstore?.get(hashKey)
}
