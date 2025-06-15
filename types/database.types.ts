// データベース型定義の完全分離
export interface BaseEntity {
  id: string
  createdAt: string | null
  updatedAt: string | null
}

// ユーザー関連型
export interface UserEntity extends BaseEntity {
  xummUserToken: string | null
  xrplAddress: string | null
  username: string | null
  avatarUrl: string | null
}

export interface CreateUserInput {
  xrplAddress: string
  xummUserToken?: string
  username?: string
  avatarUrl?: string
}

export interface UpdateUserInput {
  xummUserToken?: string
  username?: string
  avatarUrl?: string
}

// 投稿関連型
export type PostCategory = 'trading' | 'portfolio' | 'news' | 'question'

export interface PostEntity extends BaseEntity {
  userId: string | null
  content: string
  category: PostCategory
  ipfsHash: string | null
  likesCount: number | null
  repliesCount: number | null
}

export interface CreatePostInput {
  content: string
  category: PostCategory
  ipfsHash?: string
}

export interface UpdatePostInput {
  content?: string
  category?: PostCategory
  likesCount?: number
  repliesCount?: number
}

// インタラクション関連型
export type InteractionType = 'like' | 'reply' | 'share'

export interface UserInteractionEntity extends BaseEntity {
  userId: string | null
  postId: string | null
  interactionType: InteractionType
}

export interface CreateInteractionInput {
  userId: string
  postId: string
  interactionType: InteractionType
}

// 価格アラート関連型
export type AlertCondition = 'above' | 'below'

export interface PriceAlertEntity extends BaseEntity {
  userId: string | null
  symbol: string
  condition: AlertCondition
  targetPrice: number
  isActive: boolean | null
  triggeredAt: string | null
}

export interface CreatePriceAlertInput {
  symbol: string
  condition: AlertCondition
  targetPrice: number
  isActive?: boolean
}

export interface UpdatePriceAlertInput {
  condition?: AlertCondition
  targetPrice?: number
  isActive?: boolean
  triggeredAt?: string
}

// クエリ関連型
export interface PaginationOptions {
  limit?: number
  offset?: number
}

export interface PostQueryOptions extends PaginationOptions {
  category?: PostCategory | 'all'
  userId?: string
  sortBy?: 'createdAt' | 'likesCount' | 'repliesCount'
  sortOrder?: 'asc' | 'desc'
}

export interface UserQueryOptions extends PaginationOptions {
  searchTerm?: string
  sortBy?: 'createdAt' | 'username'
  sortOrder?: 'asc' | 'desc'
}

// 統計関連型
export interface CommunityStats {
  totalPosts: number
  totalUsers: number
  todayPosts: number
  activeUsers: number
  topCategories: Array<{
    category: PostCategory
    count: number
  }>
}

export interface UserStats {
  postCount: number
  likesReceived: number
  repliesReceived: number
  joinedDaysAgo: number
  reputation: number
}

// レスポンス型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// エラー型
export interface DatabaseError {
  code: string
  message: string
  details?: any
  timestamp: number
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// ヘルスチェック型
export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  timestamp: number
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded'
  services: {
    database: HealthCheckResult
    cache: HealthCheckResult
    storage: HealthCheckResult
    xumm: HealthCheckResult
  }
  timestamp: number
}
