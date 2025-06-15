import { redirect } from 'react-router'
import type { Route } from './+types/logout'

export async function action({ context: { sessionCookie } }: Route.ActionArgs) {
  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionCookie.serialize('', { maxAge: 1 }),
    },
  })
}
