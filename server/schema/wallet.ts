import * as v from 'valibot'

// Wallet生成リクエストスキーマ
export const generateWalletRequestSchema = v.object({
  network: v.optional(v.picklist(['mainnet', 'testnet', 'devnet'])),
  entropy: v.optional(v.string()),
})

// Wallet情報レスポンススキーマ
export const walletResponseSchema = v.object({
  address: v.string(),
  publicKey: v.string(),
  privateKey: v.string(),
  seed: v.string(),
  network: v.string(),
  createdAt: v.string(),
})

// Wallet検証リクエストスキーマ
export const validateWalletRequestSchema = v.object({
  address: v.pipe(
    v.string(),
    v.minLength(25, 'XRPLアドレスは25文字以上である必要があります'),
    v.maxLength(34, 'XRPLアドレスは34文字以下である必要があります'),
    v.regex(/^r[a-zA-Z0-9]{24,33}$/, 'XRPLアドレスの形式が正しくありません'),
  ),
})

// Wallet検証レスポンススキーマ
export const validateWalletResponseSchema = v.object({
  isValid: v.boolean(),
  address: v.string(),
  network: v.optional(v.string()),
})
