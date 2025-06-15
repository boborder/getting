import type { Context } from 'hono'
import type * as v from 'valibot'
import { Wallet } from 'xrpl'
import type { generateWalletRequestSchema, validateWalletRequestSchema } from '../schema/wallet'

// Wallet生成ハンドラー
export const generateWalletHandler = async (
  c: Context<
    any,
    any,
    {
      in: { json: v.InferInput<typeof generateWalletRequestSchema> }
      out: { json: any }
    }
  >,
) => {
  try {
    const { network = 'testnet', entropy } = c.req.valid('json')

    // Walletを生成
    const wallet = entropy ? Wallet.fromEntropy(entropy) : Wallet.generate()

    const response = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seed: wallet.seed,
      network,
      createdAt: new Date().toISOString(),
    }

    console.log(`🔑 新しいWallet生成: ${wallet.address} (${network})`)

    return c.json(response)
  } catch (error) {
    console.error('❌ Wallet生成エラー:', error)
    return c.json(
      {
        error: 'Wallet生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
}

// Wallet検証ハンドラー
export const validateWalletHandler = async (
  c: Context<
    any,
    any,
    {
      in: { json: v.InferInput<typeof validateWalletRequestSchema> }
      out: { json: any }
    }
  >,
) => {
  try {
    const { address } = c.req.valid('json')

    // XRPLアドレスの基本的な検証
    const isValid = /^r[a-zA-Z0-9]{24,33}$/.test(address)

    const response = {
      isValid,
      address,
      network: isValid ? 'unknown' : undefined,
    }

    console.log(`🔍 Wallet検証: ${address} -> ${isValid ? '有効' : '無効'}`)

    return c.json(response)
  } catch (error) {
    console.error('❌ Wallet検証エラー:', error)
    return c.json(
      {
        error: 'Wallet検証に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
}

// ランダムWallet生成ハンドラー（パラメータなし）
export const generateRandomWalletHandler = async (c: Context) => {
  try {
    const wallet = Wallet.generate()

    const response = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seed: wallet.seed,
      network: 'testnet',
      createdAt: new Date().toISOString(),
    }

    console.log(`🎲 ランダムWallet生成: ${wallet.address}`)

    return c.json(response)
  } catch (error) {
    console.error('❌ ランダムWallet生成エラー:', error)
    return c.json(
      {
        error: 'ランダムWallet生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
}
