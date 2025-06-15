import { createCookie } from 'react-router'

// セキュアなセッションクッキーを作成する関数
// cookie名は session
// クッキーの有効期限は 360 秒
// httpOnly にする
// クッキーのシークレットは secrets カンマ区切りの文字列
export const SessionCookie = (secrets: string, secure: boolean) =>
  createCookie('session', {
    httpOnly: true,
    secrets: secrets.split(','),
    maxAge: 360,
    path: '/',
    sameSite: 'lax',
    secure,
  })
