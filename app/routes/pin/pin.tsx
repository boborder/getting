import { parseFormData } from '@mjackson/form-data-parser'
import { Form, useFetcher, useNavigation } from 'react-router'
import type { Route } from './+types/pin'
import { PinataSDK } from 'pinata-web3'

export const loader = async ({ context }: Route.LoaderArgs) => {
  // 本番環境のみ ローカルではエラーになる
  if (context.cloudflare.env.APP_ENV === 'production') {
    const pinata = new PinataSDK({
      pinataJwt: context.cloudflare.env.PINATA_JWT,
    })
    const files = await pinata.usage.pinnedFileCount()
    const storage = await pinata.usage.totalStorageSize()
    return { files, storage }
  }
  return { files: 0, storage: 0 }
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await parseFormData(request)
  const file = formData.get('file') as File
  if (!file) {
    return { error: 'Not found file' }
  }
  const pinata = new PinataSDK({
    pinataJwt: context.cloudflare.env.PINATA_JWT,
  })
  try {
    const result = await pinata.upload
      .file(file)
      .addMetadata({
        name: file.name,
        keyValues: { key: new Date().toLocaleString('sv-SE') },
      })
      .cidVersion(1)
    console.log(result)
    return { result }
  } catch (error) {
    console.error(error)
    return { error: 'Internal Server Error' }
  }
}

export default function Pin({ actionData, loaderData }: Route.ComponentProps) {
  const data = actionData
  const { state } = useNavigation()
  const fetcher = useFetcher()
  const gateway = 'https://gateway.pinata.cloud/ipfs/'
  const r2 = 'https://r2.cloudflarestorage.com/'

  return (
    <div className='contents-center'>
      <p className='text-2xl'>Storage: {loaderData.storage}</p>
      <p className='text-xl'>Files: {loaderData.files}</p>
      <div className='responsive'>
        <div className='stat'>
          {data?.result && (
            <img src={gateway + data.result.IpfsHash} width={256} height={256} className='my-4' alt='PIN' />
          )}
          <h3>Pinata</h3>
          <Form method='post' action='/pin' encType='multipart/form-data' className='join join-vertical my-3'>
            <input type='file' name='file' accept='image/*' className='file-input join-item' />
            <button type='submit' disabled={state === 'submitting'} className='join-item'>
              {state === 'submitting' ? 'Uploading...' : 'Pinata'}
            </button>
          </Form>
        </div>

        <div className='stat'>
          {fetcher.data && <p>{r2 + fetcher.data.rows[0].key}</p>}
          <h3>R2</h3>
          <fetcher.Form
            method='post'
            action='/pin/r2'
            encType='multipart/form-data'
            className='join join-vertical my-3'
          >
            <input type='file' name='file' accept='image/*' className='file-input join-item' />
            <button type='submit' disabled={fetcher.state === 'submitting'} className='join-item'>
              {fetcher.state === 'submitting' ? 'Uploading...' : 'Bucket'}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  )
}
