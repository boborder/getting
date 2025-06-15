import type { Key, MutatorOptions, SWRConfiguration, SWRResponse } from 'swr'
import useSWR, { useSWRConfig } from 'swr'

// 状態を更新するためのコールバック関数の型を定義
export type StateMutatorCallback<T> = (currentData: T) => T | Promise<T>

// 状態を更新するための関数の型を定義
export type StateMutator<T> = (data: T | StateMutatorCallback<T>, opts?: boolean | MutatorOptions<T>) => void

// 状態の永続化を行うためのインターフェースを定義
export type StateStore<T = any> = {
  onGet: (key: Key) => T | Promise<T>
  onSet: (key: Key, data: T) => void | Promise<void>
}

// ストアのパラメータを定義するインターフェース
export interface StoreParams<T> {
  key: Key
  init: T
  store?: StateStore<T>
}

// useStoreフックを定義
export function useStore<T, E = any>(data: StoreParams<T>, swrConfig?: SWRConfiguration) {
  const { key, init, store } = data

  // SWRのキャッシュ
  const { cache } = useSWRConfig()

  // SWRを使用してデータを取得
  const swrResponse = useSWR(
    key,

    // promise
    () =>
      //store か  cache が無ければ init 渡す
      Promise.resolve(store?.onGet(key) as T).then(
        (resolvedData) => resolvedData ?? cache.get(key as string)?.data ?? init,
      ),

    // fallbackData は init 渡す Immutable に設定
    {
      fallbackData: init,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      ...swrConfig,
    },
  )

  // SWRからデータとmutate関数を取得
  const { data: state, mutate } = swrResponse

  // setState はmutateをラップ
  const setState: StateMutator<T> = (data: T | StateMutatorCallback<T>, opts?: boolean | MutatorOptions<T>) =>
    mutate(() => {
      const setStore = (newState: T) => store?.onSet(key, newState as T)
      if (typeof data !== 'function') {
        setStore(data)
        return data
      }
      const mutatorCallback = data as StateMutatorCallback<T>
      return Promise.resolve(mutatorCallback(state as T)).then((newData) => {
        setStore(newData)
        return newData
      })
    }, opts)

  return [state as T, setState, swrResponse as SWRResponse<T, E>] as const
}
// const [state, setState, { data }] = useStore({ key: "key", init: "init", store?: { onGet: () => "init", onSet: () => {} } })

// const [state, setState, { data }] = createStore({ key: "key", init: "init", store: { onGet: () => "init", onSet: () => {} } })
// ストアを作成する関数
export function createStore<T, E = any>(data: StoreParams<T>, swrConfig?: SWRConfiguration) {
  return (init?: T) =>
    useStore<T, E>(
      {
        ...data,
        init: init ?? data.init,
      },
      swrConfig,
    )
}

export default useStore
