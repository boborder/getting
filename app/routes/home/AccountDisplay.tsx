// Components
import { Card, CardBody, CardTitle } from '~/components/ui/Card'
import { Collapse } from '~/components/ui/Collapse'
import { StatItem, StatsContainer } from '~/components/ui/Stats'

// Utils
import { type XRPLAccountData, formatAccountStatus } from '~/utils/xrpl'

// 🎯 アカウント表示プロパティ
interface AccountDisplayProps {
  accountData: XRPLAccountData
  className?: string
  title?: string
  showTitle?: boolean
  showRawData?: boolean
  showDetailedStats?: boolean
}

// 🎯 再利用可能なアカウント情報表示コンポーネント
export const AccountDisplay = ({
  accountData,
  className = 'max-w-4xl mx-auto m-1',
  title = '📊 アカウント情報',
  showTitle = true,
  showRawData = true,
  showDetailedStats = true,
}: AccountDisplayProps) => {
  return (
    <Card size='sm' background='base-100' className={className}>
      <CardBody>
        {showTitle && (
          <CardTitle size='sm' className='text-success mb-4'>
            {title}
          </CardTitle>
        )}

        {/* メイン統計 */}
        <StatsContainer vertical={true} responsive={true}>
          <StatItem
            title='Balance'
            value={accountData.isActivated ? accountData.balance : '0'}
            description='XRP残高'
            variant='primary'
          />
          <StatItem
            title='Sequence'
            value={accountData.sequence}
            description='トランザクション数'
            variant='secondary'
          />
          <StatItem
            title='OwnerCount'
            value={accountData.ownerCount}
            description='所有オブジェクト数'
            variant='accent'
          />
        </StatsContainer>

        {/* 詳細統計（アクティベート時のみ） */}
        {showDetailedStats && accountData.isActivated && (
          <StatsContainer vertical={true} responsive={true}>
            <StatItem
              title='Transactions'
              value={accountData.transactions}
              description='トランザクション数'
              variant='info'
            />
            <StatItem title='NFTs' value={accountData.nfts} description='所有NFT数' variant='warning' />
            <StatItem
              title='Trustlines'
              value={accountData.trustlines}
              description='トラストライン数'
              variant='error'
            />
          </StatsContainer>
        )}

        {/* アカウント詳細 */}
        {accountData.isActivated && (
          <div className='flex flex-col gap-2'>
            <div className='text-xs sm:text-sm opacity-75 break-all'>
              <p>アドレス:</p>
              <strong>{accountData.address}</strong>
            </div>
            <div className='text-xs sm:text-sm opacity-75 break-all'>
              <p>ネットワーク:</p>
              <strong>{accountData.network}</strong>
            </div>
            <div className='text-xs sm:text-sm opacity-75 break-all'>
              <p>状態:</p>
              <span
                className={`ml-1 px-2 py-1 rounded text-xs ${
                  accountData.isActivated
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}
              >
                {formatAccountStatus(accountData.isActivated).text}
              </span>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {Object.keys(accountData.errors).length > 0 && (
          <div className='alert alert-warning mt-4'>
            <span>⚠️ 一部のデータ取得でエラーが発生しました:</span>
            <ul className='list-disc list-inside text-xs'>
              {Object.entries(accountData.errors).map(([key, error]) => (
                <li key={key}>
                  {key}: {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 生データ表示 */}
        {showRawData && <Collapse title='🔍 詳細データ（JSON）' content={JSON.stringify(accountData.raw, null, 2)} />}
      </CardBody>
    </Card>
  )
}

// 🎯 簡易版アカウント表示（統計のみ）
export const AccountStatsOnly = ({ accountData, className }: { accountData: XRPLAccountData; className?: string }) => {
  return (
    <div className={className}>
      <StatsContainer vertical={true} responsive={true}>
        <StatItem
          title='Balance'
          value={accountData.isActivated ? accountData.balance : '0'}
          description='XRP'
          variant='primary'
        />
        <StatItem
          title='Status'
          value={accountData.isActivated ? 'Active' : 'Inactive'}
          description='アカウント状態'
          variant={accountData.isActivated ? 'success' : 'warning'}
        />
        <StatItem title='Objects' value={accountData.ownerCount} description='所有オブジェクト' variant='info' />
      </StatsContainer>
    </div>
  )
}
