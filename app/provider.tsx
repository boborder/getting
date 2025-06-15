import { useLoaderData } from 'react-router'
import type { loader } from '~/root'
import { Provider, createStore } from 'jotai'
import { Suspense } from 'react'
import { SWRConfig } from 'swr'
import { useX } from '~/utils/xumm'

const store = createStore()
export const JotaiProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <Suspense fallback={<p>読み込み中...</p>}>
        {children}
      </Suspense>
    </Provider>
  )
}

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  const { api } = useLoaderData<typeof loader>()
  useX(api)
  return (
    <SWRConfig value={{
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }}>
      {children}
    </SWRConfig>
  )
}
