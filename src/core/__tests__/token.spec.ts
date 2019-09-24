import { TokenFactory, performTokenRefresh } from '../token'
import { Config } from '../config'
import { Token } from '../token'
import { ExpiredTokenError } from '../../utils'
import { mocked } from 'ts-jest/utils'

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
    mocked(factory.refreshToken).mockResolvedValue(undefined)

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

  it('should only trigger a reauth once', async () => {
    await Promise.all([
      performTokenRefresh(token, factory, config),
      performTokenRefresh(token, factory, config),
      performTokenRefresh(token, factory, config)
    ])

    expect(factory.refreshToken).toBeCalledTimes(1)
  })
})
