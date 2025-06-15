// Register the service worker
export const register = async () => {
  if (window && 'serviceWorker' in navigator) {
    await navigator.serviceWorker.register(import.meta.env.PROD ? '/sw.js' : '/sw.ts', {
      scope: '/',
      type: 'module',
      updateViaCache: 'none',
    })
  }
}
