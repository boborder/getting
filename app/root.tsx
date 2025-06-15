import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { Route } from './+types/root'
import './app.css'

import { Errors } from './errors'
import { JotaiProvider, SWRProvider } from './provider'
import { Layout as Template } from './layout'

export const links: Route.LinksFunction = () => [
  { rel: 'favicon', href: '/favicon.ico' },
  { rel: 'manifest', href: '/manifest.json' },
]

export async function loader({ context }: Route.LoaderArgs) {
  return { api: context.cloudflare.env.XUMM_API }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <JotaiProvider>
      <SWRProvider>
        <Template>
          <Outlet />
        </Template>
      </SWRProvider>
    </JotaiProvider>
  )
}

export function ErrorBoundary() {
  return <Errors />
}
