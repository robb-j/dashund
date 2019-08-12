class ReauthError extends Error {
  constructor(tokenName) {
    super(`Reauthentication required: '${tokenName}'`)
    this.tokenName = tokenName
  }
}

class MissingTokenError extends Error {
  constructor(tokenName) {
    super(`Missing token: '${tokenName}'`)
    this.tokenName = tokenName
  }
}

class ExpiredTokenError extends Error {
  constructor(tokenName) {
    super(`${tokenName} token has expired`)
    this.tokenName = tokenName
  }
}

module.exports = { ReauthError, MissingTokenError, ExpiredTokenError }
