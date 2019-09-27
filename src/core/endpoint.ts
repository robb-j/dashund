import ms = require('ms')

import {
  sharedLogger,
  ReauthError,
  ExpiredTokenError,
  validate,
  Criteria,
  createErrorMessage,
  assertValue
} from '../utils'

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

export function validateEndpoint(endpoint: Endpoint, name?: string) {
  const schema: Criteria = {
    name: 'string',
    interval: 'string',
    handler: 'function',
    requiredTokens: 'string[]'
  }

  assertValue(endpoint, schema, name)

  // Ensure a valid interval – https://www.npmjs.com/package/ms
  if (ms(endpoint.interval) === undefined) {
    throw new Error(
      createErrorMessage([
        {
          path: name ? `${name}.interval` : 'interval',
          expected: 'string (ms formatted)',
          got: 'ms'
        }
      ])
    )
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

      // Try to refresh the token if it has expired
      if (performTokenRefresh) {
        await performTokenRefresh(token, factory, config)
      }
    }

    // Fetch data using the handler
    let data = await endpoint.handler({
      zones: config.zones,
      tokens: config.tokens
    })

    return EndpointResult.withData(data)
  } catch (error) {
    // Look for ReauthErrors
    // -> If so and we are allowed to refresh, refresh and retry the endpoint
    if (error instanceof ReauthError) {
      // Fail now if we have no way of refreshing the token
      if (!performTokenRefresh) {
        return EndpointResult.notAuthenticated()
      }

      let token = config.tokens.get(error.tokenName)
      let factory = config.tokenFactories.get(error.tokenName)

      // Try to reauthenticate the token, skipping the hasExpired check
      await performTokenRefresh(token!, factory!, config, true)

      // Try to run the endpoint again, skipping endpoint reauth check
      return performEndpoint(endpoint, config)
    }

    if (error instanceof ExpiredTokenError) {
      return EndpointResult.notAuthenticated()
    }

    sharedLogger.error(error)
    return EndpointResult.notFound()
  }
}
