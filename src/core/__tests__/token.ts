import { TokenFactory, performTokenRefresh } from '../token'
import { Config } from '../config'
import { Token } from '../token'
import { ExpiredTokenError } from '../../utils'
import { mocked } from 'ts-jest/utils'

// describe('TokenFactory', () => {
//   describe('#constructor', () => {
//     it('should store properties', () => {
//       let createFromCLI = jest.fn()
//       let hasExpired = jest.fn()
//       let refreshToken = jest.fn()

//       let factory = new TokenFactory({
//         createFromCLI,
//         hasExpired,
//         refreshToken
//       })

//       expect(factory.createFromCLI).toEqual(createFromCLI)
//       expect(factory.hasExpired).toEqual(hasExpired)
//       expect(factory.refreshToken).toEqual(refreshToken)
//     })
//   })
// })

describe('#performTokenRefresh', () => {
  let token: Token
  let config: Config
  let factory: TokenFactory

  beforeEach(() => {
    token = { type: 'MockToken', some: 'value' }

    config = new Config()
    config.tokens.set('MockToken', token)

    factory = {
      createFromCLI: jest.fn(async () => ({ type: 'token', fromCLI: true })),
      hasExpired: jest.fn(() => true),
      refreshToken: jest.fn(async () => ({ type: 'token', refreshed: true }))
    }
  })

  it('should do nothing when hasExpired is false', async () => {
    mocked(factory.hasExpired).mockReturnValue(false)

    await performTokenRefresh(token, factory, config)
    expect(config.tokens.get('MockToken')).toEqual(token)
  })

  it('should fail if no token is returned', async () => {
    await mocked(factory.refreshToken).mockResolvedValue(null)

    let promise = performTokenRefresh(token, factory, config)
    expect(promise).rejects.toThrow(ExpiredTokenError)
  })

  it('should store the new token', async () => {
    await performTokenRefresh(token, factory, config)

    let newToken = config.tokens.get('MockToken')
    expect(newToken).toEqual({
      type: 'token',
      refreshed: true
    })
  })

  it('should mark the config for a re-write', async () => {
    await performTokenRefresh(token, factory, config)

    expect(config.isDirty).toBe(true)
  })
})
