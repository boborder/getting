import { useFetcher } from 'react-router'

export const Search = ({ path }: { path?: string }) => {
  const fetcher = useFetcher()
  const action = path ? `/${path}` : '/search'
  return (
    <fetcher.Form method='post' action={action} className='mx-auto max-w-70'>
      <div className='join'>
        <input type='search' name='q' placeholder='Search' required className='join-item' />
        <button type='submit' className='join-item' disabled={fetcher.state === 'submitting'}>
          🔍
        </button>
      </div>
    </fetcher.Form>
  )
}
