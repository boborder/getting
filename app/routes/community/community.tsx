import { useForm } from '@conform-to/react'
import { parseWithValibot } from 'conform-to-valibot'
import { atom, useAtom } from 'jotai'
import { data, Form, useActionData, useLoaderData } from 'react-router'
import useSWR from 'swr'
import * as v from 'valibot'
import { Alert } from '~/components/ui/Alert'
import { StatItem, StatsContainer } from '~/components/ui/Stats'

import { Xaman } from '~/components/xrp'
import { useUser } from '~/utils/xumm'
import type { Route } from './+types/community'

// バリデーションスキーマ
const PostSchema = v.object({
  content: v.pipe(
    v.string(),
    v.minLength(1, '投稿内容を入力してください'),
    v.maxLength(280, '280文字以内で入力してください'),
  ),
  category: v.picklist(['trading', 'portfolio', 'news', 'question'], 'カテゴリを選択してください'),
})

// 投稿データの型
interface CommunityPost {
  id: string
  content: string
  category: 'trading' | 'portfolio' | 'news' | 'question'
  author: string
  authorAddress?: string
  timestamp: Date
  likes: number
  replies: number
  isLiked: boolean
}

// Action結果の型
type ActionData = { lastResult: any } | { success: true; message: string; lastResult: any }

// jotai atoms
// const postsAtom = atom<CommunityPost[]>([])
const filterAtom = atom<string>('all')

// SWR fetcher
const fetcher = (url: string): Promise<CommunityPost[]> => fetch(url).then((res) => res.json())

export async function loader({ context }: Route.LoaderArgs) {
  console.log(context.isProduction)
  // 模擬的なコミュニティデータ
  const mockPosts: CommunityPost[] = [
    {
      id: '1',
      content: 'XRP今日も上がってるか！みんなどう思う？ 🚀',
      category: 'trading',
      author: 'crypto_trader',
      authorAddress: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      likes: 12,
      replies: 5,
      isLiked: false,
    },
    {
      id: '2',
      content: 'ポートフォリオ見直し中。みんなどんな配分でやってる？',
      category: 'portfolio',
      author: 'hodler_san',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      likes: 8,
      replies: 12,
      isLiked: true,
    },
    {
      id: '3',
      content: 'XUMM使ってる人いる？決済めっちゃ便利だよね！',
      category: 'news',
      author: 'xrpl_fan',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      likes: 15,
      replies: 8,
      isLiked: false,
    },
  ]

  return {
    posts: mockPosts,
    stats: {
      totalPosts: mockPosts.length,
      activeUsers: 42,
      todayPosts: 8,
    },
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithValibot(formData, { schema: PostSchema })

  if (submission.status !== 'success') {
    return data({ lastResult: submission.reply() }, { status: 400 })
  }

  // 実際の実装では、ここでIPFSやXUMM UserStoreに保存
  console.log('新規投稿:', submission.value)

  return data({
    success: true,
    message: '投稿が完了しました！',
    lastResult: submission.reply(),
  })
}

export default function Community({ loaderData }: Route.ComponentProps) {
  const { posts } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>() as ActionData | undefined
  const { user } = useUser()

  // jotai state management
  // const [localPosts, setLocalPosts] = useAtom(postsAtom)
  const [filter, setFilter] = useAtom(filterAtom)

  // SWR for real-time updates
  const { data: livePosts } = useSWR<CommunityPost[]>('/api/community/posts', fetcher, {
    fallbackData: posts,
    refreshInterval: 30000,
  })

  // conform form
  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: PostSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  const filteredPosts = (livePosts || posts).filter(
    (post: CommunityPost) => filter === 'all' || post.category === filter,
  )

  const getCategoryEmoji = (category: string) => {
    const emojis = {
      trading: '📈',
      portfolio: '💼',
      news: '📰',
      question: '❓',
    }
    return emojis[category as keyof typeof emojis] || '💬'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      trading: 'トレード',
      portfolio: 'ポートフォリオ',
      news: 'ニュース',
      question: '質問',
    }
    return labels[category as keyof typeof labels] || category
  }

  return (
    <>
      {/* ヘッダー統計 */}
      <div className='card bg-gradient-to-r from-primary/20 to-secondary/20 shadow-lg'>
        <div className='card-body'>
          <h1 className='card-title text-2xl'>🎯 みんなやってるか！</h1>
          <p className='text-accent/80'>XRPLコミュニティで情報共有しよう</p>

          <StatsContainer className='mt-4'>
            <StatItem title='総投稿数' value={loaderData.stats.totalPosts} description='posts' variant='primary' />
            <StatItem
              title='アクティブユーザー'
              value={loaderData.stats.activeUsers}
              description='users'
              variant='secondary'
            />
            <StatItem title='今日の投稿' value={loaderData.stats.todayPosts} description='today' variant='accent' />
          </StatsContainer>
        </div>
      </div>

      {/* 投稿フォーム */}
      <div className='card bg-base-200 shadow-lg'>
        <div className='card-body'>
          <h2 className='card-title'>✍️ 新規投稿</h2>

          {!user && (
            <>
              <Alert variant='warning' title='ログインが必要です'>
                XUMMでログインして投稿に参加しましょう
              </Alert>
              <Xaman />
            </>
          )}

          {actionData && 'success' in actionData && actionData.success && (
            <Alert variant='success' title='投稿完了'>
              {actionData.message}
            </Alert>
          )}

          <Form method='post' id={form.id} onSubmit={form.onSubmit} className='space-y-4'>
            <div className='form-control'>
              <label className='label' htmlFor={fields.content.id}>
                <span className='label-text'>投稿内容</span>
                <span className='label-text-alt'>280文字以内</span>
              </label>
              <textarea
                key={fields.content.key}
                id={fields.content.id}
                name={fields.content.name}
                className={`textarea textarea-bordered h-24 ${fields.content.errors?.[0] ? 'textarea-error' : ''}`}
                placeholder='みんなに聞きたいことや共有したいことを書こう...'
                disabled={!user}
              />
              {fields.content.errors?.[0] && (
                <div className='label'>
                  <span className='label-text-alt text-error'>{fields.content.errors[0]}</span>
                </div>
              )}
            </div>

            <div className='form-control'>
              <label className='label' htmlFor={fields.category.id}>
                <span className='label-text'>カテゴリ</span>
              </label>
              <select
                key={fields.category.key}
                id={fields.category.id}
                name={fields.category.name}
                className='select select-bordered'
                disabled={!user}
              >
                <option value=''>カテゴリを選択</option>
                <option value='trading'>📈 トレード</option>
                <option value='portfolio'>💼 ポートフォリオ</option>
                <option value='news'>📰 ニュース</option>
                <option value='question'>❓ 質問</option>
              </select>
              {fields.category.errors?.[0] && (
                <div className='label'>
                  <span className='label-text-alt text-error'>{fields.category.errors[0]}</span>
                </div>
              )}
            </div>

            <button type='submit' className='btn btn-primary' disabled={!user}>
              🚀 投稿する
            </button>
          </Form>
        </div>
      </div>

      {/* フィルター */}
      <div className='flex gap-2 flex-wrap'>
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          すべて
        </button>
        {['trading', 'portfolio', 'news', 'question'].map((category) => (
          <button
            key={category}
            className={`btn btn-sm ${filter === category ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(category)}
          >
            {getCategoryEmoji(category)} {getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* 投稿一覧 */}
      <div className='space-y-4'>
        {filteredPosts.map((post: CommunityPost) => (
          <div key={post.id} className='card bg-base-100 shadow-md hover:shadow-lg transition-shadow'>
            <div className='card-body'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='avatar placeholder'>
                    <div className='bg-neutral text-neutral-content rounded-full w-8'>
                      <span className='text-xs'>{post.author[0].toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className='font-bold'>{post.author}</div>
                    <div className='text-xs opacity-70'>{post.timestamp.toLocaleString('ja-JP')}</div>
                  </div>
                </div>
                <div className='badge badge-xs badge-outline'>
                  {getCategoryEmoji(post.category)} {getCategoryLabel(post.category)}
                </div>
              </div>

              <p className='mt-3'>{post.content}</p>

              <div className='card-actions justify-between items-center mt-4'>
                <div className='flex gap-4'>
                  <button className={`btn btn-sm btn-ghost btn-circle ${post.isLiked ? 'text-red-500' : ''}`}>
                    {post.isLiked ? '❤️' : '🤍'} {post.likes}
                  </button>
                  <button className='btn btn-sm btn-ghost btn-circle'>💬 {post.replies}</button>
                </div>
                {post.authorAddress && (
                  <div className='text-xs opacity-50 font-mono'>
                    {post.authorAddress.slice(0, 8)}...{post.authorAddress.slice(-6)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className='text-center py-12 opacity-50'>
          <p className='text-lg'>まだ投稿がありません</p>
          <p>最初の投稿をしてみませんか？</p>
        </div>
      )}
    </>
  )
}
