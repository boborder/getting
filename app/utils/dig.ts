import type {
  AccountChannelsResponse,
  AccountCurrenciesResponse,
  AccountInfoResponse,
  AccountLinesResponse,
  AccountLinesTrustline,
  AccountNFToken,
  AccountNFTsResponse,
  AccountObject,
  AccountObjectsResponse,
  AccountTxResponse,
  AccountTxTransaction,
  Balance,
  BookOffersResponse,
  Channel,
  FeeResponse,
} from 'xrpl'
import { Client } from 'xrpl'

export const dig = async (
  account: string,
  ws?: string,
  ...options: Array<'info' | 'tx' | 'obj' | 'nft' | 'currency' | 'line' | 'channel'>
) => {
  const network = ws ? ws : 'wss://xrpl.ws'
  const client = new Client(network)
  if (!client.isConnected()) {
    await client.connect()
  }

  // デフォルトで全ての情報を取得するように設定
  const finalOptions = {
    info: options.length === 0 || options.includes('info'),
    tx: options.length === 0 || options.includes('tx'),
    obj: options.length === 0 || options.includes('obj'),
    nft: options.length === 0 || options.includes('nft'),
    currency: options.length === 0 || options.includes('currency'),
    line: options.length === 0 || options.includes('line'),
    channel: options.length === 0 || options.includes('channel'),
  }

  // 並列実行用のPromise配列
  const promises: Promise<any>[] = []
  const results: {
    info?: AccountInfoResponse
    tx?: AccountTxTransaction[]
    obj?: AccountObject[]
    nft?: AccountNFToken[]
    currency?: string[]
    line?: AccountLinesTrustline[]
    channel?: Channel[]
    isActivated?: boolean
    errors?: Record<string, string>
  } = {
    errors: {},
    isActivated: undefined, // 明示的にundefinedで初期化
  }

  console.log('🔍 dig関数開始:', account, '(' + network + ')')
  console.log('📋 取得オプション:', finalOptions)

  // 1. アカウント情報取得（最も重要、個別エラーハンドリング）
  if (finalOptions.info) {
    promises.push(
      client
        .request({
          command: 'account_info',
          account: account,
        })
        .then((response) => {
          console.log('✅ account_info成功:', response.result.account_data.Account)
          results.info = response
          results.isActivated = true
        })
        .catch((error) => {
          console.log('⚠️ account_infoエラー:', error)
          if (error?.data?.error === 'actNotFound') {
            // アカウントが存在しない（未アクティベート）
            results.isActivated = false
            console.log(`❌ アカウント ${account} は未アクティベートです`)
          } else {
            results.errors!.info = `account_info取得エラー: ${error.message || 'Unknown error'}`
            console.warn('❌ account_info取得エラー:', error)
            // 他のエラーの場合、アクティベート状態は不明
            results.isActivated = false
          }
        }),
    )
  }

  // 2. トランザクション履歴（失敗しても続行）
  if (finalOptions.tx) {
    promises.push(
      client
        .request({
          command: 'account_tx',
          account: account,
          ledger_index_max: -1,
          limit: 10,
          tx_type: 'DIDSet',
        })
        .then((response: AccountTxResponse) => {
          results.tx = response.result.transactions
        })
        .catch((error) => {
          results.errors!.tx = `account_tx取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_tx取得エラー:', error)
          results.tx = []
        }),
    )
  }

  // 3. アカウントオブジェクト（失敗しても続行）
  if (finalOptions.obj) {
    promises.push(
      client
        .request({
          command: 'account_objects',
          account: account,
          type: 'did',
        })
        .then((response: AccountObjectsResponse) => {
          results.obj = response.result.account_objects
        })
        .catch((error) => {
          results.errors!.obj = `account_objects取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_objects取得エラー:', error)
          results.obj = []
        }),
    )
  }

  // 4. NFT情報（失敗しても続行）
  if (finalOptions.nft) {
    promises.push(
      client
        .request({
          command: 'account_nfts',
          account: account,
        })
        .then((response: AccountNFTsResponse) => {
          results.nft = response.result.account_nfts
        })
        .catch((error) => {
          results.errors!.nft = `account_nfts取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_nfts取得エラー:', error)
          results.nft = []
        }),
    )
  }

  // 5. 通貨情報（失敗しても続行）
  if (finalOptions.currency) {
    promises.push(
      client
        .request({
          command: 'account_currencies',
          account: account,
        })
        .then((response: AccountCurrenciesResponse) => {
          results.currency = response.result.receive_currencies
        })
        .catch((error) => {
          results.errors!.currency = `account_currencies取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_currencies取得エラー:', error)
          results.currency = []
        }),
    )
  }

  // 6. トラストライン情報（失敗しても続行）
  if (finalOptions.line) {
    promises.push(
      client
        .request({
          command: 'account_lines',
          account: account,
        })
        .then((response: AccountLinesResponse) => {
          results.line = response.result.lines
        })
        .catch((error) => {
          results.errors!.line = `account_lines取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_lines取得エラー:', error)
          results.line = []
        }),
    )
  }

  // 7. チャンネル情報（失敗しても続行）
  if (finalOptions.channel) {
    promises.push(
      client
        .request({
          command: 'account_channels',
          account: account,
        })
        .then((response: AccountChannelsResponse) => {
          results.channel = response.result.channels
        })
        .catch((error) => {
          results.errors!.channel = `account_channels取得エラー: ${error.message || 'Unknown error'}`
          console.warn('account_channels取得エラー:', error)
          results.channel = []
        }),
    )
  }

  // 全てのリクエストを並列実行（エラーがあっても続行）
  await Promise.allSettled(promises)
  await client.disconnect()

  console.log('📊 dig関数完了 - 最終結果:', {
    hasInfo: !!results.info,
    isActivated: results.isActivated,
    txCount: results.tx?.length || 0,
    nftCount: results.nft?.length || 0,
    lineCount: results.line?.length || 0,
    errorCount: Object.keys(results.errors || {}).length,
  })

  return results
}

// 使用例
// const digResult = await dig('r9cZA1mLK5R5Am25ArfXF7wGRPXsQaXZ9drg', 'wss://s.alt.net', ['info', 'tx', nft',]);
// console.log(digResult);

export const xrpPrice = async () => {
  const param = {
    method: 'book_offers',
    params: [
      {
        taker: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        taker_gets: {
          currency: 'XRP',
        },
        taker_pays: {
          currency: 'USD',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        },
        limit: 1,
      },
    ],
  }
  const response = (await fetch('https://xrpl.ws', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(param),
  }).then((res) => res.json())) as BookOffersResponse
  const price = Number(response?.result?.offers[0]?.quality) * 1000000
  return price
}

export const fee = async () => {
  const param = {
    method: 'fee',
    params: {},
  }
  const response = (await fetch('https://xrpl.ws', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(param),
  }).then((res) => res.json())) as FeeResponse
  return response
}

export const getTx = async (account: string, network?: string, type?: string) => {
  const client = new Client(network || 'wss://xrpl.ws')
  if (!client.isConnected()) {
    await client.connect()
  }
  if (type) {
    const txData: AccountTxResponse = await client.request({
      command: 'account_tx',
      account: account,
      ledger_index_max: -1,
      limit: 1,
      tx_type: type,
    })
    await client.disconnect()
    return txData.result.transactions[0]
  }
  const txData: AccountTxResponse = await client.request({
    command: 'account_tx',
    account: account,
    ledger_index_max: -1,
    limit: 1,
  })
  await client.disconnect()
  return txData.result.transactions[0]
}

export const getBalance = async (account: string, network?: string) => {
  const res = await fetch(network ? network : 'https://xrpl.ws', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'account_info',
      params: [{ account: account }],
    }),
  })
  const data = (await res.json()) as AccountInfoResponse
  return Number(data.result.account_data.Balance) / 1000000
}
