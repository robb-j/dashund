const ms = require('ms')

const {
  sharedLogger,
  ReauthError,
  requiredArg,
  ExpiredTokenError
} = require('../utils')

class EndpointResult {
  static withData(data) {
    return new EndpointResult(data, 200)
  }

  static notFound() {
    return new EndpointResult(null, 404)
  }

  static notAuthenticated() {
    return new EndpointResult(null, 401)
  }

  /**
    @param {object|null} data
    @param {number} status
   */
  constructor(data, status) {
    this.data = data
    this.status = status
  }

  /**
    @param {string} name
   */
  serialize(name) {
    return {
      type: name,
      data: this.data,
      status: this.status
    }
  }
}

/** A function responsible for periodically fetching information */
class Endpoint {
  constructor({
    name = requiredArg('name'),
    interval = requiredArg('interval'),
    handler = requiredArg('handler'),
    requiredTokens = []
  } = {}) {
    if (ms(interval) === undefined) throw new Error('invalid interval')

    if (!requiredTokens.every(name => typeof name === 'string')) {
      throw new Error('requiredTokens should be a string[]')
    }

    this.name = name
    this.interval = interval
    this.handler = handler
    this.requiredTokens = requiredTokens
  }

  /** @returns {EndpointResult} */
  async performEndpoint(config, attemptRefresh = true) {
    try {
      // Ensure required tokens are set and gather them into an array
      for (let tokenName of this.requiredTokens) {
        let token = config.tokens.get(tokenName)
        let factory = config.tokenFactories.get(tokenName)

        if (factory.hasExpired(token)) {
          await factory.performRefresh(token, config)
        }
      }

      // Fetch data using the handler
      // NOTE: await is needed here so ReauthError is caught
      let data = await this.handler({
        zones: config.zones,
        tokens: config.tokens
      })

      return EndpointResult.withData(data)
    } catch (error) {
      // Look for ReauthErrors
      // -> If so and we are allowed to refresh, refresh and retry the endpoint
      if (attemptRefresh && error instanceof ReauthError) {
        let token = config.tokens.get(error.tokenName)
        let factory = config.tokenFactories.get(error.tokenName)

        // Try to reauthenticate the token, skipping the hasExpired check
        await factory.performRefresh(token, config, true)

        // Try to run the endpoint again, skipping this reauth check
        return this.performEndpoint(config, false)
      }

      if (error instanceof ExpiredTokenError) {
        return EndpointResult.notAuthenticated()
      }

      sharedLogger.error(error)
      return EndpointResult.notFound()
    }
  }
}

module.exports = { Endpoint, EndpointResult }
