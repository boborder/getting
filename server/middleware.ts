import { Hono } from 'hono'
import { getConnInfo } from 'hono/cloudflare-workers'
import { getCookie, setCookie } from 'hono/cookie'
import { etag } from 'hono/etag'
import { createMiddleware } from 'hono/factory'
import { languageDetector } from 'hono/language'
import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { endTime, setMetric, startTime, timing } from 'hono/timing'

const cookie = createMiddleware<HonoEnv>(async (c, next) => {
  const uuid = getCookie(c, 'uuid') || crypto.randomUUID()
  setCookie(c, 'uuid', uuid)
  c.set('uuid', uuid)
  await next()
})

const timer = createMiddleware(async (c, next) => {
  setMetric(c, 'cookie-time', 420, 'cookie')
  startTime(c, 'timer')
  await next()
  endTime(c, 'timer')
})

const setHeader = createMiddleware<HonoEnv>(async (c, next) => {
  const message = c.env.APP_ENV
  if (message) {
    c.res.headers.set('X-Message', message)
  }
  await next()
})

const connInfo = createMiddleware(async (c, next) => {
  const info = getConnInfo(c)
  c.set('ip', info.remote.address || '::1')
  await next()
})

const context = createMiddleware((c, next) => {
  c.set('message', 'やってるか')
  return next()
})

// const middleware = auth.use(
const middleware = new Hono<HonoEnv>().use(
  timing(),
  context,
  cookie,
  timer,
  connInfo,
  setHeader,
  requestId(),
  etag(),
  logger(),
  prettyJSON(),
  poweredBy(),
  languageDetector({
    supportedLanguages: ['ja', 'en'],
    fallbackLanguage: 'ja',
  }),
  secureHeaders(),
)

export default middleware
