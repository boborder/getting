import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../schema'

// データベースクライアント型
export type DatabaseClient = DrizzleD1Database<typeof schema>

// データベースクライアント作成
export function createDatabaseClient(d1: D1Database): DatabaseClient {
  return drizzle(d1, { schema })
}

// 開発環境用のモッククライアント
export function createMockDatabaseClient(): DatabaseClient {
  // 開発環境やテスト環境で使用するモッククライアント
  const mockD1 = {
    prepare: () => ({
      bind: () => ({
        all: () => Promise.resolve({ results: [], meta: {} }),
        first: () => Promise.resolve(null),
        run: () => Promise.resolve({ success: true, meta: {} }),
      }),
    }),
    exec: () => Promise.resolve({ results: [], meta: {} }),
  } as unknown as D1Database

  return drizzle(mockD1, { schema })
}

// データベース接続ヘルパー
export async function connectDatabase(context: {
  cloudflare?: { env?: { DB?: D1Database } }
}): Promise<DatabaseClient> {
  const d1 = context.cloudflare?.env?.DB

  if (!d1) {
    console.warn('D1 database not available, using mock client')
    return createMockDatabaseClient()
  }

  return createDatabaseClient(d1)
}

// トランザクションヘルパー
export async function withTransaction<T>(db: DatabaseClient, callback: (tx: DatabaseClient) => Promise<T>): Promise<T> {
  // D1はまだトランザクションをサポートしていないため、
  // 将来的な実装のためのプレースホルダー
  return await callback(db)
}
