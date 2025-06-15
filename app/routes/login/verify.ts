import type { Route } from './+types/verify'

// 成功したら success: true を返す
export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.cloudflare

  const secretKey = env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    return { success: false, message: 'TURNSTILE_SECRET_KEY is required' }
  }
  // token を取得
  const formData = await request.formData()
  const token = formData.get('token') as string
  if (!token) {
    return { success: false, message: 'token is required' }
  }

  const challenge = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  const secret = `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`

  const verifyResponse = await fetch(challenge, {
    method: 'POST',
    body: secret,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  const verifyData = (await verifyResponse.json()) as any

  if (verifyData.success) {
    return { success: true, message: 'ok' }
  }
  return { success: false, message: 'failed' }
}
