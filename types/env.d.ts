import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { PinataSDK } from 'pinata-web3'

declare global {
  interface HonoEnv {
    Bindings: Env
    Variables: {
      DB: DrizzleD1Database
      pinata: PinataSDK
      message: string
      uuid: string
      userName: string
      ip?: string
    }
  }
}
