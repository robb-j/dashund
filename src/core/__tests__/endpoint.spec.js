const { Endpoint, TokenFactory, Config } = require('../index')
const { ReauthError } = require('../../utils')

describe('Endpoint', () => {
  describe('#constructor', () => {
    it('should enforce a name', () => {
      let init = () =>
        new Endpoint({
          interval: '5ms',
          handler: () => {}
        })

      expect(init).toThrow(/name is require/)
    })

    it('should enforce an interval', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          handler: () => {}
        })

      expect(init).toThrow(/interval is required/)
    })

    it('should enforce a handler', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          interval: '5ms'
        })

      expect(init).toThrow(/handler is required/)
    })

    it('should enforce requiredTokens are strings', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          interval: '5ms',
          handler: () => {},
          requiredTokens: [1, 2, 3]
        })

      expect(init).toThrow(/requiredTokens should be a string\[\]/)
    })

    it('should validate interval is an ms value', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          interval: 'bad_interval',
          handler: () => {}
        })

      expect(init).toThrow(/invalid interval/)
    })

    it('should store values', () => {
      let e = new Endpoint({
        name: 'test/endpoint',
        interval: '5ms',
        handler: () => {},
        requiredTokens: ['TestToken']
      })

      expect(e.name).toEqual('test/endpoint')
      expect(e.interval).toEqual('5ms')
      expect(e.handler).toBeInstanceOf(Function)
      expect(e.requiredTokens).toEqual(['TestToken'])
    })
  })

  describe('#performEndpoint', () => {
    let endpoint, tokenFactory, config
    beforeEach(() => {
      endpoint = new Endpoint({
        name: 'test/endpoint',
        interval: '5ms',
        handler: jest.fn(() => ({ some: 'data' })),
        requiredTokens: ['MockToken']
      })

      tokenFactory = new TokenFactory({
        createFromCLI: jest.fn(),
        hasExpired: jest.fn(() => false),
        refreshToken: jest.fn(() => ({}))
      })
      tokenFactory.performRefresh = jest.fn()

      config = new Config()
      config.tokenFactories.set('MockToken', tokenFactory)
      config.tokens.set('MockToken', { type: 'MockToken' })
    })

    it('should return the data', async () => {
      let result = await endpoint.performEndpoint(config)
      expect(result).toEqual({ some: 'data' })
    })

    it('should pass zones and tokens to the handler', async () => {
      await endpoint.performEndpoint(config)

      expect(endpoint.handler).toBeCalledWith(
        expect.objectContaining({
          tokens: expect.any(Map),
          zones: expect.any(Map)
        })
      )
    })

    it('should refresh expired tokens', async () => {
      tokenFactory.hasExpired.mockReturnValue(true)
      await endpoint.performEndpoint(config)

      expect(tokenFactory.performRefresh).toBeCalled()
    })

    it('should handle a ReauthError', async () => {
      endpoint.handler.mockRejectedValueOnce(new ReauthError('MockToken'))

      let data = await endpoint.performEndpoint(config)

      expect(tokenFactory.performRefresh).toBeCalled()

      expect(data).toEqual({ some: 'data' })
    })
  })
})
