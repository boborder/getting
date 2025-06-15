import type { PinataSDK } from 'pinata-web3'

// 分散ストレージの型定義
export interface DistributedStorageConfig {
  pinata?: {
    jwt: string
    gateway?: string
  }
  r2?: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
  }
  strategy: 'ipfs-only' | 'r2-only' | 'hybrid'
}

// データリストの型定義
export interface DataList<T = any> {
  version: string
  timestamp: number
  totalCount: number
  lastUpdated: number
  metadata: {
    source: string
    checksum: string
    compression?: string
  }
  data: T[]
}

// 投稿リストの型定義
export interface PostList extends DataList {
  data: Array<{
    id: string
    userId: string
    content: string
    category: 'trading' | 'portfolio' | 'news' | 'question'
    author: string
    authorAddress?: string
    timestamp: string
    likes: number
    replies: number
    ipfsHash?: string
    tags?: string[]
  }>
}

// ユーザーリストの型定義
export interface UserList extends DataList {
  data: Array<{
    id: string
    xrplAddress: string
    username: string
    avatarUrl?: string
    joinedAt: string
    postCount: number
    reputation: number
  }>
}

// 価格データリストの型定義
export interface PriceDataList extends DataList {
  data: Array<{
    symbol: string
    price: number
    change24h: number
    volume24h: number
    timestamp: string
    source: string
  }>
}

/**
 * 分散ストレージ管理クラス
 */
export class DistributedStorageManager {
  private config: DistributedStorageConfig
  private pinata?: PinataSDK

  constructor(config: DistributedStorageConfig) {
    this.config = config
    this.initializePinata()
  }

  private initializePinata() {
    if (this.config.pinata?.jwt) {
      // Pinata SDK の初期化（実際の実装では適切にインポート）
      // this.pinata = new PinataSDK({ pinataJwt: this.config.pinata.jwt })
    }
  }

  /**
   * データリストをIPFSに保存
   */
  async saveToIPFS<T>(dataList: DataList<T>, filename: string): Promise<{ hash: string; url: string } | null> {
    try {
      if (!this.pinata) {
        throw new Error('Pinata not initialized')
      }

      // チェックサムを計算
      const checksum = await this.calculateChecksum(dataList)
      dataList.metadata.checksum = checksum

      // IPFSに保存
      const result = await this.pinata.upload.json(dataList, {
        metadata: {
          name: filename,
          keyValues: {
            type: 'data-list',
            version: dataList.version,
            timestamp: dataList.timestamp.toString(),
          },
        },
      })

      const gateway = this.config.pinata?.gateway || 'https://gateway.pinata.cloud'
      return {
        hash: result.IpfsHash,
        url: `${gateway}/ipfs/${result.IpfsHash}`,
      }
    } catch (error) {
      console.error('IPFS save error:', error)
      return null
    }
  }

  /**
   * IPFSからデータリストを取得
   */
  async loadFromIPFS<T>(hash: string): Promise<DataList<T> | null> {
    try {
      const gateway = this.config.pinata?.gateway || 'https://gateway.pinata.cloud'
      const response = await fetch(`${gateway}/ipfs/${hash}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const dataList = (await response.json()) as DataList<T>

      // チェックサム検証
      const calculatedChecksum = await this.calculateChecksum(dataList)
      if (calculatedChecksum !== dataList.metadata.checksum) {
        console.warn('Checksum mismatch detected')
      }

      return dataList
    } catch (error) {
      console.error('IPFS load error:', error)
      return null
    }
  }

  /**
   * R2にデータリストを保存
   */
  async saveToR2<T>(dataList: DataList<T>, key: string): Promise<{ url: string } | null> {
    try {
      if (!this.config.r2) {
        throw new Error('R2 not configured')
      }

      // チェックサムを計算
      const checksum = await this.calculateChecksum(dataList)
      dataList.metadata.checksum = checksum

      // R2に保存（実際の実装では AWS SDK を使用）
      // const jsonData = JSON.stringify(dataList, null, 2)

      // 模擬的な実装
      const url = `https://${this.config.r2.bucketName}.r2.cloudflarestorage.com/${key}`

      // 実際の実装:
      // const s3Client = new S3Client({ ... })
      // await s3Client.send(new PutObjectCommand({ ... }))

      return { url }
    } catch (error) {
      console.error('R2 save error:', error)
      return null
    }
  }

  /**
   * R2からデータリストを取得
   */
  async loadFromR2<T>(key: string): Promise<DataList<T> | null> {
    try {
      if (!this.config.r2) {
        throw new Error('R2 not configured')
      }

      const url = `https://${this.config.r2.bucketName}.r2.cloudflarestorage.com/${key}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const dataList = (await response.json()) as DataList<T>

      // チェックサム検証
      const calculatedChecksum = await this.calculateChecksum(dataList)
      if (calculatedChecksum !== dataList.metadata.checksum) {
        console.warn('Checksum mismatch detected')
      }

      return dataList
    } catch (error) {
      console.error('R2 load error:', error)
      return null
    }
  }

  /**
   * ハイブリッド保存（IPFS + R2）
   */
  async saveHybrid<T>(
    dataList: DataList<T>,
    filename: string,
  ): Promise<{ ipfsHash?: string; r2Key?: string; urls: string[] }> {
    const results: string[] = []
    let ipfsHash: string | undefined
    let r2Key: string | undefined

    // IPFS に保存
    if (this.config.strategy === 'hybrid' || this.config.strategy === 'ipfs-only') {
      const ipfsResult = await this.saveToIPFS(dataList, filename)
      if (ipfsResult) {
        ipfsHash = ipfsResult.hash
        results.push(ipfsResult.url)
      }
    }

    // R2 に保存
    if (this.config.strategy === 'hybrid' || this.config.strategy === 'r2-only') {
      r2Key = `data-lists/${filename}-${Date.now()}.json`
      const r2Result = await this.saveToR2(dataList, r2Key)
      if (r2Result) {
        results.push(r2Result.url)
      }
    }

    return { ipfsHash, r2Key, urls: results }
  }

  /**
   * データリストの作成
   */
  createDataList<T>(data: T[], source: string, version = '1.0'): DataList<T> {
    return {
      version,
      timestamp: Date.now(),
      totalCount: data.length,
      lastUpdated: Date.now(),
      metadata: {
        source,
        checksum: '', // 後で計算
      },
      data,
    }
  }

  /**
   * 投稿リストの作成・保存
   */
  async savePostList(
    posts: PostList['data'],
    source = 'community-posts',
  ): Promise<{ ipfsHash?: string; r2Key?: string; urls: string[] }> {
    const postList = this.createDataList(posts, source) as PostList
    const filename = `posts-${new Date().toISOString().split('T')[0]}`

    return this.saveHybrid(postList, filename)
  }

  /**
   * ユーザーリストの作成・保存
   */
  async saveUserList(
    users: UserList['data'],
    source = 'community-users',
  ): Promise<{ ipfsHash?: string; r2Key?: string; urls: string[] }> {
    const userList = this.createDataList(users, source) as UserList
    const filename = `users-${new Date().toISOString().split('T')[0]}`

    return this.saveHybrid(userList, filename)
  }

  /**
   * 価格データリストの作成・保存
   */
  async savePriceDataList(
    priceData: PriceDataList['data'],
    source = 'price-feed',
  ): Promise<{ ipfsHash?: string; r2Key?: string; urls: string[] }> {
    const priceList = this.createDataList(priceData, source) as PriceDataList
    const filename = `prices-${new Date().toISOString().split('T')[0]}`

    return this.saveHybrid(priceList, filename)
  }

  /**
   * データの整合性チェック
   */
  async verifyDataIntegrity<T>(dataList: DataList<T>): Promise<boolean> {
    try {
      const calculatedChecksum = await this.calculateChecksum(dataList)
      return calculatedChecksum === dataList.metadata.checksum
    } catch (error) {
      console.error('Data integrity check failed:', error)
      return false
    }
  }

  /**
   * チェックサム計算
   */
  private async calculateChecksum<T>(dataList: DataList<T>): Promise<string> {
    const { createHash } = await import('node:crypto')
    const dataString = JSON.stringify(dataList.data)
    return createHash('sha256').update(dataString).digest('hex')
  }

  /**
   * データリストのマージ
   */
  mergeDataLists<T>(
    list1: DataList<T>,
    list2: DataList<T>,
    mergeStrategy: 'append' | 'replace' | 'merge' = 'append',
  ): DataList<T> {
    let mergedData: T[]

    switch (mergeStrategy) {
      case 'append':
        mergedData = [...list1.data, ...list2.data]
        break
      case 'replace':
        mergedData = list2.data
        break
      case 'merge':
        // 簡単なマージ（実際の実装では適切なキーでマージ）
        mergedData = [...list1.data, ...list2.data]
        break
      default:
        mergedData = list1.data
    }

    return {
      version: Math.max(Number.parseFloat(list1.version), Number.parseFloat(list2.version)).toString(),
      timestamp: Math.max(list1.timestamp, list2.timestamp),
      totalCount: mergedData.length,
      lastUpdated: Date.now(),
      metadata: {
        source: `merged-${list1.metadata.source}-${list2.metadata.source}`,
        checksum: '', // 後で計算
      },
      data: mergedData,
    }
  }

  /**
   * 古いデータの自動削除
   */
  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    // 実装は使用するストレージサービスに依存
    console.log(`Cleaning up data older than ${maxAge}ms`)
  }
}

/**
 * 分散ストレージマネージャーのファクトリー関数
 */
export function createDistributedStorage(config: DistributedStorageConfig): DistributedStorageManager {
  return new DistributedStorageManager(config)
}

/**
 * データリストのバリデーション
 */
export function validateDataList<T>(dataList: DataList<T>): boolean {
  return !!(
    dataList.version &&
    dataList.timestamp &&
    dataList.totalCount >= 0 &&
    dataList.metadata &&
    dataList.data &&
    Array.isArray(dataList.data)
  )
}
