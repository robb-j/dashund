import { Dashund } from '../dashund'
import { Config } from './config'

import { sharedLogger, ExpiredTokenError } from '../utils'

export interface Token {
  type: string
  [idx: string]: any
}

export type RefreshRequest = Promise<Token>

export interface TokenFactory {
  createFromCLI(dashund: Dashund): Promise<Token>
  hasExpired(token: Token): boolean
  refreshToken(token: Token): Promise<Token | null>
}

export type TokenRefresher = typeof performTokenRefresh

export async function performTokenRefresh(
  token: Token,
  factory: TokenFactory,
  config: Config,
  skipExpiry = false
) {
  try {
    // Do nothing if the token hasn't expired
    if (!skipExpiry && !factory.hasExpired(token)) return

    // Refresh the token
    let newValue = await factory.refreshToken(token)

    // Do nothing if it didn't renew
    if (!newValue) {
      throw new Error(`${token.type}#refreshToken returned nothing`)
    }

    const newToken = {
      type: token.type,
      ...newValue
    }

    // Store the new token
    config.tokens.set(token.type, newToken)

    // Mark the config for a re-write
    config.isDirty = true

    return newToken
  } catch (error) {
    sharedLogger.debug(error)
    throw new ExpiredTokenError(token.type)
  }
}

export function validateTokenFactory(value: any) {
  // TODO: ...
  return true
}
