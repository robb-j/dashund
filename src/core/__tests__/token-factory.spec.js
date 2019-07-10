const { TokenFactory } = require('../token-factory')
const { Config } = require('../config')
const { ExpiredTokenError } = require('../../utils')

describe('TokenFactory', () => {
  describe('#constructor', () => {
    it('should require a "createFromCLI"', () => {
      let exec = () => new TokenFactory()
      expect(exec).toThrow(/createFromCLI is required/)
    })
    it('should store properties', () => {
      let createFromCLI = jest.fn()
      let hasExpired = jest.fn()
      let refreshToken = jest.fn()

      let factory = new TokenFactory({
        createFromCLI,
        hasExpired,
        refreshToken
      })

      expect(factory.createFromCLI).toEqual(createFromCLI)
      expect(factory.hasExpired).toEqual(hasExpired)
      expect(factory.refreshToken).toEqual(refreshToken)
    })
  })

  describe('#performRefresh', () => {
    let token, config, factory
    beforeEach(() => {
      token = { type: 'MockToken', some: 'value' }

      config = new Config()
      config.tokens.set('MockToken', token)

      factory = new TokenFactory({
        createFromCLI: jest.fn(async () => ({ fromCLI: true })),
        hasExpired: jest.fn(() => true),
        refreshToken: jest.fn(async () => ({ refreshed: true }))
      })
    })

    it('should do nothing when hasExpired is false', async () => {
      await factory.hasExpired.mockReturnValue(false)

      await factory.performRefresh(token, config)
      expect(config.tokens.get('MockToken')).toEqual(token)
    })

    it('should fail if no token is returned', async () => {
      await factory.refreshToken.mockResolvedValue(null)

      let promise = factory.performRefresh(token, config)
      expect(promise).rejects.toThrow(ExpiredTokenError)
    })

    it('should store the new token', async () => {
      await factory.performRefresh(token, config)

      let newToken = config.tokens.get('MockToken')
      expect(newToken).toEqual({
        type: 'MockToken',
        refreshed: true
      })
    })

    it('should mark the config for a re-write', async () => {
      await factory.performRefresh(token, config)

      expect(config.isDirty).toBe(true)
    })
  })
})
