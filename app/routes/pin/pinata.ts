import { PinataSDK } from 'pinata-web3'
import type { Route } from './+types/pinata'

export async function action({ request, context }: Route.ActionArgs) {
  const data = (await request.json()) as any
  const metadata = {
    name: data.name || new Date().toLocaleString('sv-SE') + '.json',
    keyValues: { json: new Date().toLocaleString('sv-SE') },
  }
  const pinata = new PinataSDK({
    pinataJwt: context.cloudflare.env.PINATA_JWT,
  })
  try {
    const result = await pinata.upload.json(data).addMetadata(metadata).cidVersion(1)
    console.log(result)
    return { result }
  } catch (error) {
    console.error(error)
    return { error: 'Internal Server Error' }
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.cloudflare
  const test = (await fetch('https://api.pinata.cloud/data/pinList?pageLimit=5', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`,
    },
  }).then((res) => res.json())) as any
  console.log(test)
  return { result: test.rows }
}
