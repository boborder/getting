import { parseFormData } from '@mjackson/form-data-parser'
import type { Route } from './+types/r2'

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await parseFormData(request)
  const file = formData.get('file') as File

  if (!file) {
    return new Response('No file uploaded', { status: 400 })
  }

  const { env } = context.cloudflare
  const bucket = await env.R2.put(file.name, await file.arrayBuffer())
  return { result: bucket }
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { env } = context.cloudflare
  const key = (params as any).key
  console.log(key)
  if (key) {
    const object = await env.R2.get(key)
    if (!object) {
      return { message: 'Object not found' }
    }
    return { result: object }
  }

  const bucket = await env.R2.list()
  return { result: bucket }
}
