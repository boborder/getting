import { atom, useAtom, useAtomValue } from 'jotai'
import useSWR from 'swr'
import { Client } from 'xrpl'
import { networkAtom } from './Networks'

// ===== 型定義 =====

type ClientStatus = {
  connected: boolean
  connecting: boolean
  error?: string
  lastConnected?: number
}

// ===== Jotai Atoms =====

// クライアント管理
const clientStatusAtom = atom<Record<string, ClientStatus>>({})
const clientInstanceAtom = atom<Record<string, Client>>({})

// ===== API関数 =====

const connectToNetwork = async (networkUrl: string): Promise<{ client: Client; status: ClientStatus }> => {
  try {
    const client = new Client(networkUrl)
    await client.connect()

    const status: ClientStatus = {
      connected: true,
      connecting: false,
      lastConnected: Date.now(),
    }

    return { client, status }
  } catch (error) {
    const status: ClientStatus = {
      connected: false,
      connecting: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }

    throw { status, error }
  }
}

// ===== カスタムフック =====

// クライアント管理フック
export const useXrplClient = () => {
  const networkUrl = useAtomValue(networkAtom)
  const [clientInstances, setClientInstances] = useAtom(clientInstanceAtom)
  const [clientStatuses, setClientStatuses] = useAtom(clientStatusAtom)

  const {
    data: connectionData,
    error,
    mutate,
  } = useSWR(['xrpl-client', networkUrl], () => connectToNetwork(networkUrl), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    onSuccess: ({ client, status }) => {
      setClientInstances((prev) => ({ ...prev, [networkUrl]: client }))
      setClientStatuses((prev) => ({ ...prev, [networkUrl]: status }))
    },
    onError: ({ status }) => {
      setClientStatuses((prev) => ({ ...prev, [networkUrl]: status }))
    },
  })

  const currentStatus = clientStatuses[networkUrl] || { connected: false, connecting: false }

  const getClient = async (): Promise<Client> => {
    const existingClient = clientInstances[networkUrl]
    if (existingClient && currentStatus.connected) {
      return existingClient
    }

    const result = await mutate()
    if (result) {
      return result.client
    }

    throw new Error('Failed to connect to XRPL network')
  }

  const disconnect = async () => {
    const client = clientInstances[networkUrl]
    if (client?.isConnected()) {
      await client.disconnect()
      setClientStatuses((prev) => ({
        ...prev,
        [networkUrl]: { connected: false, connecting: false },
      }))
    }
  }

  return {
    getClient,
    disconnect,
    status: currentStatus,
    networkUrl,
    reconnect: mutate,
    isLoading: !connectionData && !error,
    error,
  }
}
