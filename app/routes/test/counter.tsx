import { Outlet } from 'react-router'
import type { Route } from './+types/counter'

export async function loader({ context }: Route.LoaderArgs) {
  const { cloudflare } = context
  const { env } = cloudflare
  const count = (await env.KV.get('count')) || '0'
  await env.KV.put('count', (Number(count) + 1).toString())
  return { count: Number(count) }
}

export default function Counter({ loaderData }: Route.ComponentProps) {
  const { count } = loaderData
  return (
    <>
      <div>訪問者数: {count}</div>
      <Outlet />
    </>
  )
}
