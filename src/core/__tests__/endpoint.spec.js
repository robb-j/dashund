const { Endpoint } = require('../endpoint')

describe('Endpoint', () => {
  describe('#constructor', () => {
    it('should enforce a name', () => {
      let init = () =>
        new Endpoint({
          interval: '5ms',
          handler: () => {}
        })

      expect(init).toThrow(/invalid name/)
    })

    it('should enforce an interval', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          handler: () => {}
        })

      expect(init).toThrow(/invalid interval/)
    })

    it('should enforce a handler', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          interval: '5ms'
        })

      expect(init).toThrow(/invalid handler/)
    })

    it('should enforce requiredTokens are strings', () => {
      let init = () =>
        new Endpoint({
          name: 'test/endpoint',
          interval: '5ms',
          handler: () => {},
          requiredTokens: [1, 2, 3]
        })

      expect(init).toThrow(/invalid requiredTokens/)
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
})
