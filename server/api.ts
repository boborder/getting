import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

import { describeRoute, openAPISpecs } from 'hono-openapi'
import { resolver, validator as vValidator } from 'hono-openapi/valibot'

import { swaggerUI } from '@hono/swagger-ui'
import { basicAuth } from 'hono/basic-auth'

// スキーマのインポート
import { bodySchema, errorResponseSchema, querySchema, responseSchema } from './schema/user'
import {
  generateWalletRequestSchema,
  validateWalletRequestSchema,
  validateWalletResponseSchema,
  walletResponseSchema,
} from './schema/wallet'

// ハンドラーのインポート
import { createUserHandler, getUserHandler } from './handlers/user'
import { generateRandomWalletHandler, generateWalletHandler, validateWalletHandler } from './handlers/wallet'

const app = new Hono<HonoEnv>()

const basic = createMiddleware(async (c, next) => {
  await basicAuth({
    username: c.env.USERNAME,
    password: c.env.PASSWORD,
  })(c, next)
})

const docs = {
  documentation: {
    info: {
      title: 'みんなやってるか',
      version: '0.0.1',
      description: 'みんなやってるか API 仕様書',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'development',
      },
      {
        url: 'https://xn--u8j4bj2job.xn--q9jyb4c',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        } as const,
      },
    },
    security: [{ basicAuth: [] }],
  },
}

const api = app
  // ユーザー関連のルート
  .get(
    '/api/user',
    describeRoute({
      tags: ['user'],
      description: 'クエリパラメータを受け取る',
      parameters: [
        {
          name: 'name',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'バリデーションが通った場合',
          content: {
            'application/json': { schema: resolver(responseSchema) },
          },
        },
        500: {
          description: 'バリデーションが通らなかった場合',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    vValidator('query', querySchema),
    getUserHandler,
  )
  .post(
    '/api/user',
    describeRoute({
      tags: ['user'],
      description: 'ユーザー情報を作成する',
      requestBody: {
        content: {
          'application/json': { schema: bodySchema },
        },
      },
      responses: {
        200: {
          description: 'ユーザー情報',
          content: {
            'application/json': { schema: resolver(responseSchema) },
          },
        },
        400: {
          description: 'Bad Request',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    vValidator('json', bodySchema),
    createUserHandler,
  )

  // Wallet関連のルート
  .post(
    '/api/wallet/generate',
    describeRoute({
      tags: ['wallet'],
      description: 'XRPLウォレットを生成する',
      requestBody: {
        content: {
          'application/json': { schema: generateWalletRequestSchema },
        },
      },
      responses: {
        200: {
          description: '生成されたウォレット情報',
          content: {
            'application/json': { schema: resolver(walletResponseSchema) },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    vValidator('json', generateWalletRequestSchema),
    generateWalletHandler,
  )
  .get(
    '/api/wallet/random',
    describeRoute({
      tags: ['wallet'],
      description: 'ランダムなXRPLウォレットを生成する',
      responses: {
        200: {
          description: '生成されたウォレット情報',
          content: {
            'application/json': { schema: resolver(walletResponseSchema) },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    generateRandomWalletHandler,
  )
  .post(
    '/api/wallet/validate',
    describeRoute({
      tags: ['wallet'],
      description: 'XRPLアドレスを検証する',
      requestBody: {
        content: {
          'application/json': { schema: validateWalletRequestSchema },
        },
      },
      responses: {
        200: {
          description: '検証結果',
          content: {
            'application/json': { schema: resolver(validateWalletResponseSchema) },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    vValidator('json', validateWalletRequestSchema),
    validateWalletHandler,
  )

  .get('/openapi.json', openAPISpecs(app, docs))
  .get('/api/v1', basic, swaggerUI({ url: '/openapi.json' }))

export default api

export type ApiType = typeof api
