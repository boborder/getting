import { ripemd160 } from '@noble/hashes/ripemd160'
import { type ECDSA, Wallet } from 'xrpl'

export const sha = async (text: string, salt?: string) => {
  const input = salt ? `${text}${salt}` : text
  const encodeText = new TextEncoder().encode(input)
  const shaBuffer = await crypto.subtle.digest('SHA-256', encodeText)
  const uint8Array = new Uint8Array(shaBuffer)
  const shaHex = Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  // const gravatar = `https://www.gravatar.com/avatar/${shaHex}s=256&d=identicon`
  return shaHex
}

export const rip = (text: string, salt?: string) => {
  const input = salt ? `${text}${salt}` : text
  const encodeText = new TextEncoder().encode(input)
  const ripBuffer = ripemd160(encodeText)
  const uint8Array = new Uint8Array(ripBuffer)
  const ripHex = Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return ripHex
}

export const hash = async (text: string, salt?: string) => {
  return rip(await sha(text, salt), salt)
}

export const ed = async () => {
  const wallet = Wallet.generate('ed25519' as ECDSA)
  return {
    ...wallet,
    hash: await hash(wallet.classicAddress),
  }
}

export const emailHash = async (email: string) => {
  const encodeText = new TextEncoder().encode(email)
  const hashArray = await crypto.subtle.digest('md5', encodeText)
  const uint8Array = new Uint8Array(hashArray)
  const hashHex = Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}

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
