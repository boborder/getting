import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { languageDetector } from 'hono/language'
// import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { requestId } from 'hono/request-id'
import { handle } from 'hono/service-worker'
import { timing } from 'hono/timing'
import { vanitySearch } from './app/utils'

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const app = new Hono()
const sw = app
  .use(
    // logger(),
    requestId(),
    timing(),
    etag(),
    poweredBy({ serverName: 'sw' }),
    languageDetector({
      supportedLanguages: ['ja', 'en'],
      fallbackLanguage: 'ja',
    }),
  )
  .basePath('/sw')
  .get('/:id?/:path?', async (c) => {
    const { id, path } = c.req.param()
    if (path) {
      return c.json({ id, path, env: c.env })
    }
    if (id) {
      return c.text(id)
    }
    return c.text(crypto.randomUUID())
  })
  .get('/vanity', async (c) => {
    const { keyword } = c.req.query()
    if (!keyword) {
      return c.json({ error: 'keyword is required' }, 400)
    }
    const result = await vanitySearch(keyword, 2)
    if (result.length > 0) {
      return c.json({ result })
    }
    return c.json({ error: 'No result found' }, 404)
  })

self.addEventListener('fetch', handle(sw) as EventListener)

self.addEventListener('install', async (event) => {
  console.log('sw install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', async (event) => {
  console.log('sw activate')
  event.waitUntil(self.clients.claim())
})
