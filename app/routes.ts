import { index, layout, prefix, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home/index.tsx'),
    layout('routes/test/counter.tsx', [
      ...prefix('/test', [index('routes/test/test.tsx'), route(':wallet', 'routes/test/wallet.tsx')]),
    ]),
    ...prefix('/login', [
      index('routes/login/login.tsx'),
      route('verify', 'routes/login/verify.ts'),
      route('logout', 'routes/login/logout.ts'),
    ]),
    ...prefix('/community', [index('routes/community/community.tsx')]),
    ...prefix('/portfolio', [route('*', 'routes/portfolio/portfolio.tsx')]),
    ...prefix('/dashboard', [route('*', 'routes/dashboard/dashboard.tsx')]),
    ...prefix('/alerts', [route('*', 'routes/alerts/alerts.tsx')]),
    ...prefix('/pin', [
      index('routes/pin/pin.tsx'),
      route('pinata', 'routes/pin/pinata.ts'),
      route('r2', 'routes/pin/r2.ts'),
    ]),
  ]),
  layout('routes/chart/chart.tsx', [
    ...prefix('/chart', [index('routes/chart/market.tsx'), route(':symbol', 'routes/chart/linechart.tsx')]),
  ]),
] satisfies RouteConfig
