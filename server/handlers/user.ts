import type { Context } from 'hono'
import type * as v from 'valibot'
import type { bodySchema, querySchema } from '../schema/user'

// ユーザー情報取得ハンドラー（GET）
export const getUserHandler = async (
  c: Context<
    any,
    any,
    {
      in: { query: v.InferInput<typeof querySchema> }
      out: { json: any }
    }
  >,
) => {
  const { name, email } = c.req.valid('query')

  if (name && email) {
    return c.json({ message: `Hello, ${name}! Your email is ${email}.` })
  }
  if (name) {
    return c.json({ message: `Hello, ${name}!` })
  }
  if (email) {
    return c.json({ message: `Your email is ${email}.` })
  }
  return c.json({ message: 'Hello, World!' })
}

// ユーザー作成ハンドラー（POST）
export const createUserHandler = async (
  c: Context<
    any,
    any,
    {
      in: { json: v.InferInput<typeof bodySchema> }
      out: { json: any }
    }
  >,
) => {
  const { name, email } = c.req.valid('json')

  console.log(`👤 新しいユーザー作成: ${name} (${email})`)

  return c.json({ message: `Hello, ${name}! Your email is ${email}.` })
}
