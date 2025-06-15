import type { Route } from './+types/alerts'

import { atom, useAtom } from 'jotai'
import { atomWithStorage, useHydrateAtoms } from 'jotai/utils'
import { Xaman } from '~/components/xrp'
import { Alert } from '~/components/ui/Alert'
import { StatItem, StatsContainer } from '~/components/ui/Stats'
import { useUser } from '~/utils/xumm'

// 価格アラートの型定義
interface PriceAlert {
  id: string
  symbol: string
  condition: 'above' | 'below'
  price: number
  currentPrice: number
  isActive: boolean
  createdAt: Date
  userId?: string
}

// 新規アラートフォームの型定義
interface NewAlertForm {
  symbol: string
  condition: 'above' | 'below'
  price: string
}

// Jotai atoms
const alertsAtom = atomWithStorage<PriceAlert[]>('price-alerts', [
  {
    id: '1',
    symbol: 'XRP',
    condition: 'above',
    price: 0.6,
    currentPrice: 0.55,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    symbol: 'BTC',
    condition: 'below',
    price: 40000,
    currentPrice: 42000,
    isActive: true,
    createdAt: new Date(),
  },
])

const newAlertFormAtom = atom<NewAlertForm>({
  symbol: 'XRP',
  condition: 'above',
  price: '',
})

// 派生atom（フィルタリング）
const userAlertsAtom = atom((get) => {
  const alerts = get(alertsAtom)
  // 実際の実装では、ログインユーザーのアラートのみフィルタリング
  return alerts
})

// アクションatoms
const addAlertAtom = atom(null, (get, set, newAlert: Omit<PriceAlert, 'id' | 'createdAt'>) => {
  const alerts = get(alertsAtom)
  const alert: PriceAlert = {
    ...newAlert,
    id: Date.now().toString(),
    createdAt: new Date(),
  }
  set(alertsAtom, [...alerts, alert])
})

const toggleAlertAtom = atom(null, (get, set, id: string) => {
  const alerts = get(alertsAtom)
  set(
    alertsAtom,
    alerts.map((alert) => (alert.id === id ? { ...alert, isActive: !alert.isActive } : alert)),
  )
})

const deleteAlertAtom = atom(null, (get, set, id: string) => {
  const alerts = get(alertsAtom)
  set(
    alertsAtom,
    alerts.filter((alert) => alert.id !== id),
  )
})

export async function loader({ context }: Route.LoaderArgs) {
  const { isProduction } = context
  return {
    isProduction,
  }
}

export default function Alerts({ loaderData }: Route.ComponentProps) {
  const { user } = useUser()
  useHydrateAtoms([[alertsAtom, []]])
  const [alerts] = useAtom(userAlertsAtom)
  const [newAlertForm, setNewAlertForm] = useAtom(newAlertFormAtom)
  const [, addAlert] = useAtom(addAlertAtom)
  const [, toggleAlert] = useAtom(toggleAlertAtom)
  const [, deleteAlert] = useAtom(deleteAlertAtom)
  console.log(loaderData)

  const handleAddAlert = () => {
    if (!newAlertForm.price) return

    addAlert({
      symbol: newAlertForm.symbol,
      condition: newAlertForm.condition,
      price: Number.parseFloat(newAlertForm.price),
      currentPrice: 0.55, // Mock current price - 実際の実装では現在価格を取得
      isActive: true,
      userId: user?.account,
    })

    // フォームリセット
    setNewAlertForm({
      symbol: 'XRP',
      condition: 'above',
      price: '',
    })
  }

  const updateNewAlertForm = (updates: Partial<NewAlertForm>) => {
    setNewAlertForm((prev) => ({ ...prev, ...updates }))
  }

  return (
    <>
      <Alert variant='info' title='価格アラート機能'>
        設定した価格に到達したときに通知を受け取れます
      </Alert>

      {!user && (
        <>
          <Alert variant='warning' title='ログインが必要です'>
            XUMMでログインしてアラート機能を使用しましょう
          </Alert>
          <Xaman />
        </>
      )}

      <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
        <div className='form-control'>
          <label className='label' htmlFor='alert-symbol'>
            <span className='label-text'>通貨</span>
          </label>
          <select
            id='alert-symbol'
            className='select select-bordered'
            value={newAlertForm.symbol}
            onChange={(e) => updateNewAlertForm({ symbol: e.target.value })}
            disabled={!user}
          >
            <option value='XRP'>XRP</option>
            <option value='BTC'>BTC</option>
            <option value='ETH'>ETH</option>
            <option value='XAH'>XAH</option>
          </select>
        </div>

        <div className='form-control'>
          <label className='label' htmlFor='alert-condition'>
            <span className='label-text'>条件</span>
          </label>
          <select
            id='alert-condition'
            className='select select-bordered'
            value={newAlertForm.condition}
            onChange={(e) => updateNewAlertForm({ condition: e.target.value as 'above' | 'below' })}
            disabled={!user}
          >
            <option value='above'>以上</option>
            <option value='below'>以下</option>
          </select>
        </div>

        <div className='form-control'>
          <label className='label' htmlFor='alert-price'>
            <span className='label-text'>価格</span>
          </label>
          <input
            id='alert-price'
            type='number'
            step='0.01'
            className='input input-bordered'
            placeholder='0.00'
            value={newAlertForm.price}
            onChange={(e) => updateNewAlertForm({ price: e.target.value })}
            disabled={!user}
          />
        </div>

        <div className='form-control'>
          <div className='label'>
            <span className='label-text'>&nbsp;</span>
          </div>
          <button className='btn btn-primary' onClick={handleAddAlert} disabled={!newAlertForm.price || !user}>
            🚨 追加
          </button>
        </div>
      </div>

      {/* アラート一覧 */}
      <div className='overflow-x-auto w-full'>
        <table className='table table-xs table-pin-cols'>
          <thead>
            <tr>
              <th>通貨</th>
              <th>条件</th>
              <th>目標価格</th>
              <th>現在価格</th>
              <th>状態</th>
              <th>作成日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td className='font-bold'>{alert.symbol}</td>
                <td>
                  <span className={`badge ${alert.condition === 'above' ? 'badge-success' : 'badge-warning'}`}>
                    {alert.condition === 'above' ? '📈 以上' : '📉 以下'}
                  </span>
                </td>
                <td className='font-mono'>${alert.price.toFixed(4)}</td>
                <td className='font-mono'>${alert.currentPrice.toFixed(4)}</td>
                <td>
                  <span className={`badge ${alert.isActive ? 'badge-success' : 'badge-neutral'}`}>
                    {alert.isActive ? '🟢 有効' : '⚪ 無効'}
                  </span>
                </td>
                <td className='text-sm'>{alert.createdAt.toLocaleDateString('ja-JP')}</td>
                <td>
                  <div className='flex gap-2'>
                    <button
                      className={`btn btn-xs ${alert.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleAlert(alert.id)}
                      disabled={!user}
                    >
                      {alert.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button className='btn btn-xs btn-error' onClick={() => deleteAlert(alert.id)} disabled={!user}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alerts.length === 0 && (
        <div className='text-center py-8 opacity-50'>
          <p className='text-lg'>📭 アラートが設定されていません</p>
          <p className='text-sm'>価格変動の通知を受け取るためにアラートを設定しましょう</p>
        </div>
      )}

      {/* 統計情報 */}
      {user && alerts.length > 0 && (
        <StatsContainer shadow>
          <StatItem title='総アラート数' value={alerts.length} variant='primary' />
          <StatItem title='有効なアラート' value={alerts.filter((a) => a.isActive).length} variant='success' />
          <StatItem title='監視中の通貨' value={new Set(alerts.map((a) => a.symbol)).size} variant='accent' />
        </StatsContainer>
      )}
    </>
  )
}
