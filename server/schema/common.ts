import * as v from 'valibot'

// 共通エラーレスポンススキーマ
export const errorResponseSchema = v.object({
  error: v.string(),
  code: v.optional(v.string()),
  details: v.optional(v.any()),
})

// 成功レスポンススキーマ
export const successResponseSchema = v.object({
  success: v.boolean(),
  message: v.optional(v.string()),
})

// ページネーション用スキーマ
export const paginationSchema = v.object({
  page: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
  limit: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
})
