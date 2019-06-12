jest.mock('fs')

const fs = require('fs')
const { Config } = require('../config')
const { Configurable } = require('../configurable')

const makeMockConfigurable = () => {
  let c = new Configurable()
  c.create = jest.fn(config => ({ ...config, configured: true }))
  c.configureFromCLI = jest.fn()
  c.validateConfig = jest.fn()
  return c
}

describe('Config', () => {
  let fakeWidgetTypes, fakeAuthzTypes

  beforeEach(() => {
    fakeWidgetTypes = new Map()
    fakeAuthzTypes = new Map()

    fakeWidgetTypes.set('some_widget', makeMockConfigurable())
  })

  describe('.from', () => {
    it('should load widgets.yml', () => {
      fs.readdirSync.mockReturnValue(['widgets.yml'])
      fs.readFileSync.mockReturnValue('{}')

      Config.from('.', {}, {})

      expect(fs.readFileSync).toBeCalledWith('.dashund/widgets.yml', 'utf8')
    })

    it('should load authorizations.json', () => {
      fs.readdirSync.mockReturnValue(['authorizations.json'])
      fs.readFileSync.mockReturnValue('{}')

      Config.from('.', {}, {})

      expect(fs.readFileSync).toBeCalledWith(
        '.dashund/authorizations.json',
        'utf8'
      )
    })
  })

  describe('#parseZones', () => {
    it('should parse zones and store on self', () => {
      let input = {
        zone_a: [{ type: 'some_widget', name: 'geoff' }]
      }

      let config = new Config(fakeWidgetTypes, fakeAuthzTypes)
      config.parseZones(input)

      expect(config.zones.zone_a).toBeDefined()

      const { title, widgets } = config.zones.zone_a
      expect(title).toEqual('zone_a')
      expect(widgets).toContainEqual({
        type: 'some_widget',
        configured: true,
        name: 'geoff'
      })
    })
  })

  describe('.parseAuthz', () => {
    it('should parse authz and store on self', () => {
      let input = {
        some_service: { secret: 'password' }
      }

      let config = new Config(fakeWidgetTypes, fakeAuthzTypes)
      config.parseAuthz(input)

      expect(config.authz.some_service).toBeDefined()

      const { type, secret } = config.authz.some_service
      expect(type).toEqual('some_service')
      expect(secret).toEqual('password')
    })
  })
})
