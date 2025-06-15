import * as v from 'valibot'
import { errorResponseSchema } from './common'

export const querySchema = v.object({
  name: v.string(),
  email: v.optional(v.string()),
})

export const bodySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, '名前は必須です')),
  email: v.pipe(v.string(), v.email('有効なメールアドレスを入力してください')),
})

export const responseSchema = v.object({
  message: v.string(),
})

// 共通エラースキーマを再エクスポート
export { errorResponseSchema }
