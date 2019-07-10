const { sharedLogger, ExpiredTokenError, requiredArg } = require('../utils')

class TokenFactory {
  constructor({
    createFromCLI = requiredArg('createFromCLI'),
    hasExpired = () => false,
    refreshToken = () => null
  } = {}) {
    this.createFromCLI = createFromCLI
    this.hasExpired = hasExpired
    this.refreshToken = refreshToken
  }

  async performRefresh(token, config, skipExpiry = false) {
    try {
      // Do nothing if the token hasn't expired
      if (!skipExpiry && !this.hasExpired(token)) return

      // Refresh the token
      let newToken = await this.refreshToken(token)

      // Do nothing if it didn't renew
      if (!newToken) {
        throw new Error(`${token.type}#refreshToken returned nothing`)
      }

      // Store the new token
      config.tokens.set(token.type, {
        type: token.type,
        ...newToken
      })

      // Mark the config for a re-write
      config.isDirty = true
    } catch (error) {
      sharedLogger.debug(error)
      throw new ExpiredTokenError(token.type)
    }
  }
}

module.exports = { TokenFactory }
