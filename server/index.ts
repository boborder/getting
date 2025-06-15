import api from './api'
import middleware from './middleware'
import { hc } from 'hono/client'

const app = middleware
.route('/', api)
.get('/sum', async (c) => {
  const sum = await (c.env.OIDC as any).sum(123, 321)
  return c.json({ sum })
})

export const server = app
export const client = hc<typeof app>('/')
