import { Dashund } from '../dashund'
import { Config } from './config'

import {
  sharedLogger,
  ExpiredTokenError,
  TokenReauthFailedError,
  assertValue,
  Criteria
} from '../utils'

export interface Token {
  type: string
  [idx: string]: any
}

export type RefreshRequest = Promise<Token>

export interface TokenFactory {
  createFromCLI(dashund: Dashund): Promise<Token>
  hasExpired(token: Token): boolean
  refreshToken(token: Token): Promise<Token | undefined>
}

export type TokenRefresher = typeof performTokenRefresh

export async function performTokenRefresh(
  token: Token,
  factory: TokenFactory,
  config: Config,
  skipExpiry = false
): Promise<void> {
  try {
    // Do nothing if the token hasn't expired or we're told to skip that check
    if (!skipExpiry && !factory.hasExpired(token)) return

    // If this token has already started refreshing, re-use that request
    if (config.refreshPromises.has(token.type)) {
      await config.refreshPromises.get(token.type)
      return
    }

    // Trigger the token refreshing and store the request for subsequent calls
    let refresh = factory.refreshToken(token)
    config.refreshPromises.set(token.type, refresh)

    // Wait for the new value
    let newValue = await refresh

    // Fail if it didn't renew
    if (!newValue) throw new TokenReauthFailedError(token.type)

    // Generate a token by composing it with it's type
    const newToken: Token = {
      ...newValue,
      type: token.type
    }

    // Store the new token
    config.tokens.set(token.type, newToken)

    // Mark the config for a re-write
    config.isDirty = true

    // Un-store the refresh request
    config.refreshPromises.delete(token.type)

    return
  } catch (error) {
    sharedLogger.debug(error)
    throw new ExpiredTokenError(token.type)
  }
}

export function validateTokenFactory(value: any, name?: string) {
  const schema: Criteria = {
    createFromCLI: 'function',
    hasExpired: 'function',
    refreshToken: 'function'
  }
  assertValue(value, schema, name)
}
