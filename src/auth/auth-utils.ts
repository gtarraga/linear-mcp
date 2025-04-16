/**
 * For some reason, durable object doesn't get the c.env.OAUTH_PROVIDER injected on prod
 * so we need to use these utils to list and revoke grants for now.
 *
 * @see https://github.com/cloudflare/workers-oauth-provider/blob/f69d056a54b7eca0f869e728e47dd49e0edfb811/src/oauth-provider.ts#L2401-L2501
 */
import { env } from 'cloudflare:workers'
import type { Grant, GrantSummary, ListOptions, ListResult } from '@cloudflare/workers-oauth-provider'
/**
 * Lists all authorization grants for a specific user with pagination support
 * Returns a summary of each grant without sensitive information
 * @param userId - The ID of the user whose grants to list
 * @param options - Optional pagination parameters (limit and cursor)
 * @returns A Promise resolving to the list result with grant summaries and optional cursor
 */
export async function listUserGrants(userId: string, options?: ListOptions): Promise<ListResult<GrantSummary>> {
  // Prepare list options for KV
  const listOptions: { limit?: number; cursor?: string; prefix: string } = {
    prefix: `grant:${userId}:`,
  }

  if (options?.limit !== undefined) {
    listOptions.limit = options.limit
  }

  if (options?.cursor !== undefined) {
    listOptions.cursor = options.cursor
  }

  // Use the KV list() function to get grant keys with pagination
  const response = await env.OAUTH_KV.list(listOptions)

  // Fetch all grants in parallel and convert to grant summaries
  const grantSummaries: GrantSummary[] = []
  const promises = response.keys.map(async (key: { name: string }) => {
    const grantData: Grant | null = await env.OAUTH_KV.get(key.name, {
      type: 'json',
    })
    if (grantData) {
      // Create a summary with only the public fields
      const summary: GrantSummary = {
        id: grantData.id,
        clientId: grantData.clientId,
        userId: grantData.userId,
        scope: grantData.scope,
        metadata: grantData.metadata,
        createdAt: grantData.createdAt,
      }
      grantSummaries.push(summary)
    }
  })

  await Promise.all(promises)

  // Return result with cursor if there are more results
  return {
    items: grantSummaries,
    cursor: response.list_complete ? undefined : response.cursor,
  }
}

/**
 * Revokes an authorization grant and all its associated access tokens
 * @param grantId - The ID of the grant to revoke
 * @param userId - The ID of the user who owns the grant
 * @returns A Promise resolving when the revocation is confirmed.
 */
export async function revokeGrant(grantId: string, userId: string): Promise<void> {
  // Construct the full grant key with user ID
  const grantKey = `grant:${userId}:${grantId}`

  // Delete all access tokens associated with this grant
  const tokenPrefix = `token:${userId}:${grantId}:`

  // Handle pagination to ensure we delete all tokens even if there are more than 1000
  let cursor: string | undefined
  let allTokensDeleted = false

  // Continue fetching and deleting tokens until we've processed all of them
  while (!allTokensDeleted) {
    const listOptions: { prefix: string; cursor?: string } = {
      prefix: tokenPrefix,
    }

    if (cursor) {
      listOptions.cursor = cursor
    }

    const result = await env.OAUTH_KV.list(listOptions)

    // Delete each token in this batch
    if (result.keys.length > 0) {
      await Promise.all(
        result.keys.map((key: { name: string }) => {
          return env.OAUTH_KV.delete(key.name)
        }),
      )
    }

    // Check if we need to fetch more tokens
    if (result.list_complete) {
      allTokensDeleted = true
    } else {
      cursor = result.cursor
    }
  }

  // After all tokens are deleted, delete the grant itself
  await env.OAUTH_KV.delete(grantKey)
}
