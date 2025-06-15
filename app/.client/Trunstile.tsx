import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useRef, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import { ClientOnly } from 'remix-utils/client-only'
import type { loader } from '~/routes/login/login'

import { atom, useAtom, useSetAtom } from 'jotai'

const veriTokenAtom = atom(false)
export const useVeriToken = () => {
  return useAtom(veriTokenAtom)
}
const veriClientAtom = atom(false)
const useVeriClient = () => {
  return useAtom(veriClientAtom)
}
export const setVeriClient = () => {
  return useSetAtom(veriClientAtom)
}

export default function ClientTrunstile() {
  const { sitekey } = useLoaderData<typeof loader>()
  const ref = useRef<TurnstileInstance>(null)
  const [veriToken, setVeriToken] = useVeriToken()
  const [veriClient, setVeriClient] = useVeriClient()
  const fetcher = useFetcher()
  // クライアントがsuccessになったら /verify にトークンを送信
  const hundleVerify = (token: string) => {
    setVeriClient(true)
    const formData = new FormData()
    formData.append('token', token)
    fetcher.submit(formData, {
      method: 'POST',
      action: '/login/verify',
    })
    setVeriToken(fetcher.data?.success)
  }
  // サーバーからのレスポンスがsuccess: true の場合 veriTokenをtrueにする
  // 依存配列にfetcher.dataを入れることで、fetcher.dataが変化するたびに再実行される
  useEffect(() => {
    if (fetcher.data?.success) {
      setVeriToken(fetcher.data.success)
    }
  }, [fetcher.data, setVeriToken])

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => (
        <>
          {sitekey && (
            <Turnstile
              siteKey={sitekey}
              ref={ref}
              onSuccess={hundleVerify}
              onError={(e) => {
                console.warn('error', e)
              }}
              options={{
                theme: 'auto',
                language: 'auto',
                size: 'normal',
                retry: 'auto',
                retryInterval: 30000,
              }}
              scriptOptions={{
                async: true,
                defer: true,
                // appendTo: 'body',
                crossOrigin: 'anonymous',
              }}
              // injectScript={false}
            />
          )}
          {veriClient && (
            <div className='flex justify-center gap-1'>
              <div className='transform rotate-y-180'>🐈‍⬛</div>
              {veriToken && <div>🐈‍⬛</div>}
            </div>
          )}
        </>
      )}
    </ClientOnly>
  )
}
