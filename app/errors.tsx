import { Link, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { Collapse } from '~/components/ui/Collapse'

export const Errors = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'エラーが発生しました'
  let message = '予期しないエラーが発生しました。'
  let emoji = '😵'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'ページが見つかりません'
      message = 'お探しのページは存在しないか、移動された可能性があります。'
      emoji = '🔍'
    } else if (error.status === 500) {
      title = 'サーバーエラー'
      message = 'サーバーで問題が発生しました。しばらく時間をおいてから再度お試しください。'
      emoji = '🚨'
    } else {
      title = `エラー ${error.status}`
      message = error.statusText || '不明なエラーが発生しました。'
      emoji = '⚠️'
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    message = error.message
    stack = error.stack
    emoji = '🐛'
  }

  return (
    <div className='contents-center h-screen'>
      <Card size='lg' background='base-200'>
        <CardBody className='p-6'>
          <div className='text-6xl my-3'>{emoji}</div>

          <CardTitle size='lg' className='text-xl my-3'>
            {title}
          </CardTitle>

          <p className='text-base-content/70 my-3'>{message}</p>

          {stack ? (
            <div className='my-3 mx-auto'>
              <Collapse title='🐛 開発者向け詳細情報' content={stack} />
            </div>
          ) : null}

          <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
            <Link to='/' className='btn btn-primary'>
              🏠 ホームに戻る
            </Link>

            <button onClick={() => navigate(-1)} className='btn btn-outline'>
              ← 前のページに戻る
            </button>

          </div>

          <div className='my-3 text-xs opacity-50'>問題が続く場合は、ブラウザのキャッシュをクリアしてください</div>
        </CardBody>
      </Card>
    </div>
  )
}
