import { Form, redirect } from 'react-router'
import ClientTrunstile, { setVeriClient, useVeriToken } from '~/.client/Trunstile'
import type { Route } from './+types/login'

export async function loader({ context: { cloudflare } }: Route.LoaderArgs) {
  const { env } = cloudflare
  return { sitekey: env.TURNSTILE_KEY }
}

export async function action({ request, context: { sessionCookie } }: Route.ActionArgs) {
  const formData = await request.formData()
  const username = formData.get('username')
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionCookie.serialize(username),
    },
  })
}

export default function Login() {
  const [veriToken, setVeriToken] = useVeriToken()
  const clearVeriClient = setVeriClient()
  return (
    <>
      <Form
        method='post'
        onSubmit={() => {
          setVeriToken(false)
          clearVeriClient(false)
        }}
        className='join join-vertical'
      >
        <label className='flex gap-2 items-center input join-item'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 16 16'
            fill='currentColor'
            className='h-4 w-4 opacity-70'
          >
            <title>username</title>
            <path d='M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z' />
          </svg>
          <input
            name='username'
            type='text'
            placeholder='Username'
            defaultValue='bob'
            required
            className='input-ghost'
          />
        </label>

        <button type='submit' disabled={!veriToken} className='join-item'>
          Login
        </button>
      </Form>

      <a href='/api/auth'>
        <button type='button' disabled={!veriToken} className='w-60 my-3'>
          Sign in with SSO
        </button>
      </a>

      <ClientTrunstile />
    </>
  )
}
