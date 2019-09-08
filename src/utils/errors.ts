export class ReauthError extends Error {
  constructor(public tokenName: string) {
    super(`Reauthentication required: '${tokenName}'`)
  }
}

export class MissingTokenError extends Error {
  constructor(public tokenName: string) {
    super(`Missing token: '${tokenName}'`)
  }
}

export class ExpiredTokenError extends Error {
  constructor(public tokenName: string) {
    super(`${tokenName} token has expired`)
  }
}
