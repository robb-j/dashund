import ms = require('ms')

import { sharedLogger, ReauthError, ExpiredTokenError } from '../utils'

import { Config } from './config'
import { Token, TokenRefresher } from './token'
import { Widget } from './widget'

export class EndpointResult {
  static withData(data: any) {
    return new EndpointResult(data, 200)
  }

  static notFound() {
    return new EndpointResult(null, 404)
  }

  static notAuthenticated() {
    return new EndpointResult(null, 401)
  }

  constructor(public data: object | null, public status: number) {}

  serialize(name: string) {
    return {
      type: name,
      data: this.data,
      status: this.status
    }
  }
}

export type EndpointArgs = {
  zones: Map<string, Widget[]>
  tokens: Map<string, Token>
}

export interface Endpoint {
  name: string
  interval: string
  handler: (args: EndpointArgs) => Promise<any>
  requiredTokens: string[]
}

export function validateEndpoint(endpoint: Endpoint) {
  if (typeof endpoint.name !== 'string') {
    throw new Error('endpoint.name missing (should be a string)')
  }

  if (typeof endpoint.interval !== 'string') {
    throw new Error('endpoint.interval missing  (should be a string)')
  }

  if (!Array.isArray(endpoint.requiredTokens)) {
    throw new Error('endpoint.requiredTokens missing (should be a string[]')
  }

  if (typeof endpoint.handler !== 'function') {
    throw new Error('endpoint.handler is missing (should be a function')
  }

  // Ensure a valid interval – https://www.npmjs.com/package/ms
  if (ms(endpoint.interval) === undefined) {
    throw new Error('invalid interval')
  }
}

export async function performEndpoint(
  endpoint: Endpoint,
  config: Config,
  performTokenRefresh?: TokenRefresher
): Promise<EndpointResult> {
  try {
    // Ensure required tokens are set and gather them into an array
    for (let tokenName of endpoint.requiredTokens) {
      let token = config.tokens.get(tokenName)!
      let factory = config.tokenFactories.get(tokenName)!

      if (performTokenRefresh && factory.hasExpired(token)) {
        await performTokenRefresh(token, factory, config)
      }
    }

    // Fetch data using the handler
    // NOTE: await is needed here so ReauthError is caught
    let data = await endpoint.handler({
      zones: config.zones,
      tokens: config.tokens
    })

    return EndpointResult.withData(data)
  } catch (error) {
    // Look for ReauthErrors
    // -> If so and we are allowed to refresh, refresh and retry the endpoint
    if (error instanceof ReauthError) {
      let token = config.tokens.get(error.tokenName)
      let factory = config.tokenFactories.get(error.tokenName)

      if (performTokenRefresh) {
        // Try to reauthenticate the token, skipping the hasExpired check
        await performTokenRefresh(token!, factory!, config, true)

        // Try to run the endpoint again, skipping endpoint reauth check
        return performEndpoint(endpoint, config)
      } else {
        return EndpointResult.notAuthenticated()
      }
    }

    if (error instanceof ExpiredTokenError) {
      return EndpointResult.notAuthenticated()
    }

    sharedLogger.error(error)
    return EndpointResult.notFound()
  }
}
