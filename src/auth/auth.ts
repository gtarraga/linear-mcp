import { env } from 'cloudflare:workers'
import type { AuthRequest } from '@cloudflare/workers-oauth-provider'
import { LinearClient } from '@linear/sdk'
import { Hono } from 'hono'
import type { HonoEnv } from '~/types'

export const SCOPES = [
  //
  'read',
  'write',
  'issues:create',
  'comments:create',
]

function getUpstreamAuthorizeUrl(
  params: {
    upstream_url: string
    client_id: string
    scope: string
    redirect_uri: string
    state?: string
  } & Record<string, string>,
) {
  const { upstream_url, ...rest } = params
  const searchParams = new URLSearchParams({ ...rest, response_type: 'code' })
  return `${upstream_url}?${searchParams.toString()}`
}

async function exchangeCodeForAccessToken(params: {
  code: string | undefined
  upstream_url: string
  client_secret: string
  redirect_uri: string
  client_id: string
}): Promise<[{ access_token: string } & Record<string, string>, null] | [null, Response]> {
  const { code, upstream_url, client_secret, redirect_uri, client_id } = params
  if (!code) {
    return [null, new Response('Invalid code', { status: 400 })]
  }

  const res = await fetch(upstream_url, {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: 'authorization_code',
      prompt: 'consent', // Prompt the user every time (eg they want to change accounts)
    }),
  })

  if (!res.ok) {
    return [
      null,
      new Response('There was an issue authenticating your account and retrieving an access token. Please try again.', { status: 400 }),
    ]
  }

  const body = (await res.json()) as { access_token: string } & Record<string, string>
  return [body, null]
}

export const authRoute = new Hono<HonoEnv>()
  .get('/authorize', async (c) => {
    const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw)
    if (!oauthReqInfo.clientId) {
      return c.text('Invalid request', 400)
    }

    const url = getUpstreamAuthorizeUrl({
      upstream_url: 'https://linear.app/oauth/authorize',
      client_id: env.LINEAR_CLIENT_ID,
      scope: SCOPES.join(' '),
      redirect_uri: new URL('/auth/callback', c.req.url).href,
      state: btoa(JSON.stringify(oauthReqInfo)),
    })

    return c.redirect(url)
  })
  .get('/callback', async (c) => {
    // Get the oathReqInfo out of KV
    const oauthReqInfo = JSON.parse(atob(c.req.query('state') as string)) as AuthRequest
    if (!oauthReqInfo.clientId) {
      return c.text('Invalid state', 400)
    }

    const [payload, error] = await exchangeCodeForAccessToken({
      code: c.req.query('code'),
      upstream_url: 'https://api.linear.app/oauth/token',
      client_secret: env.LINEAR_CLIENT_SECRET,
      redirect_uri: new URL('/auth/callback', c.req.url).href,
      client_id: env.LINEAR_CLIENT_ID,
    })

    if (error) return error

    const client = new LinearClient({ accessToken: payload.access_token })
    const me = await client.viewer

    const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
      metadata: {},
      props: {
        accessToken: payload.access_token,
        email: me.email,
        userId: me.id,
      },
      request: oauthReqInfo,
      scope: oauthReqInfo.scope,
      userId: me.id,
    })

    return c.redirect(redirectTo)
  })
