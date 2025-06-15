import { SessionCookie } from 'app/cookie.server'
import { createRequestHandler } from 'react-router'

import { server } from 'server'
import { scheduled } from './triggers'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
    isProduction: boolean
    sessionCookie: { serialize: ReturnType<typeof SessionCookie>['serialize'] }
  }
}

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

const app = server.all('*', async (c) => {
  const isProduction = c.env.APP_ENV === 'production'
  return requestHandler(c.req.raw, {
    cloudflare: {
      env: c.env,
      ctx: c.executionCtx as ExecutionContext,
    },
    isProduction,
    sessionCookie: {
      serialize: async (value, options) => {
        return await SessionCookie(c.env.SESSION_COOKIE_SECRETS, isProduction).serialize(value, options)
      },
    },
  })
})

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Env>
