import { Hono } from 'hono'
import { handle } from 'hono/service-worker'

import { etag } from 'hono/etag'
import { languageDetector } from 'hono/language'
// import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { requestId } from 'hono/request-id'
import { timing } from 'hono/timing'
import type { ECDSA } from 'xrpl'
import { Wallet } from 'xrpl'

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
    const result = await vanitySearch(keyword)
    if (result.length > 0) {
      return c.json({ result })
    }
    return c.json({ error: 'No result found' }, 404)
  })

export const vanitySearch = async (key: string, max?: number) => {
  // キーワードをスペースとカンマで区切り配列にする
  const keyword: string[] = key.split(/[\s,]+/).map((k: string) => k.trim())
  console.log(keyword)
  //レスポンスの配列
  const matchedAddresses: {
    address: string
    secret?: string
  }[] = []
  const maxMatches = max || 1 //検索する最大数
  // 先頭のrを含む正規表現を作成
  const re = '^(r)(' + keyword.join('|') + ')(.+)$' // キーワードの配列を使って一つの正規表現を作成
  const regexp = new RegExp(re, 'i')

  while (matchedAddresses.length < maxMatches) {
    const account = Wallet.generate('ed25519' as ECDSA)
    const match = regexp.exec(account.address)
    if (match) {
      matchedAddresses.push({
        address: account.address,
        secret: account.seed,
      })
    }
  }
  return matchedAddresses
}

self.addEventListener('fetch', handle(sw) as EventListener)

self.addEventListener('install', async (event) => {
  console.log('sw install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', async (event) => {
  console.log('sw activate')
  event.waitUntil(self.clients.claim())
})
