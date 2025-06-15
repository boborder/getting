import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 1. users テーブル
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    xummUserToken: text('xumm_user_token').unique(),
    xrplAddress: text('xrpl_address'),
    username: text('username'),
    avatarUrl: text('avatar_url'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    xummTokenIdx: index('idx_users_xumm_token').on(table.xummUserToken),
    xrplAddressIdx: index('idx_users_xrpl_address').on(table.xrplAddress),
  }),
)

// 2. posts テーブル
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    content: text('content').notNull(),
    category: text('category', {
      enum: ['trading', 'portfolio', 'news', 'question'],
    }).notNull(),
    ipfsHash: text('ipfs_hash'), // IPFS保存用
    likesCount: integer('likes_count').default(0),
    repliesCount: integer('replies_count').default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    categoryCreatedIdx: index('idx_posts_category_created').on(table.category, table.createdAt),
    userCreatedIdx: index('idx_posts_user_created').on(table.userId, table.createdAt),
    ipfsHashIdx: index('idx_posts_ipfs_hash').on(table.ipfsHash),
  }),
)

// 3. user_interactions テーブル
export const userInteractions = sqliteTable(
  'user_interactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    postId: text('post_id').references(() => posts.id),
    interactionType: text('interaction_type', {
      enum: ['like', 'reply', 'share'],
    }).notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    postIdx: index('idx_interactions_post').on(table.postId),
    userPostTypeIdx: index('idx_interactions_user_post_type').on(table.userId, table.postId, table.interactionType),
  }),
)

// 4. price_alerts テーブル
export const priceAlerts = sqliteTable(
  'price_alerts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    symbol: text('symbol').notNull(),
    condition: text('condition', { enum: ['above', 'below'] }).notNull(),
    targetPrice: real('target_price').notNull(), // SQLiteではREALを使用
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    triggeredAt: text('triggered_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userActiveIdx: index('idx_alerts_user_active').on(table.userId, table.isActive),
    symbolIdx: index('idx_alerts_symbol').on(table.symbol),
  }),
)

// 型定義のエクスポート
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type UserInteraction = typeof userInteractions.$inferSelect
export type NewUserInteraction = typeof userInteractions.$inferInsert
export type PriceAlert = typeof priceAlerts.$inferSelect
export type NewPriceAlert = typeof priceAlerts.$inferInsert

// カテゴリ型定義
export type PostCategory = 'trading' | 'portfolio' | 'news' | 'question'
export type InteractionType = 'like' | 'reply' | 'share'
export type AlertCondition = 'above' | 'below'
