jest.mock('fs')

const fs = require('fs')
const { Config } = require('../config')
const { Configurable } = require('../configurable')

const makeMockConfigurable = () => {
  let c = new Configurable()
  c.create = jest.fn(config => ({ ...config }))
  c.configureFromCLI = jest.fn()
  return c
}

describe('Config', () => {
  let widgetFactories, tokenFactories

  beforeEach(() => {
    widgetFactories = new Map()
    tokenFactories = new Map()

    widgetFactories.set('some_widget', makeMockConfigurable())
  })

  describe('.from', () => {
    it('should load widgets.yml', () => {
      fs.readdirSync.mockReturnValue(['widgets.yml'])
      fs.readFileSync.mockReturnValue('{}')

      Config.from('.', {}, {})

      expect(fs.readFileSync).toBeCalledWith('.dashund/widgets.yml', 'utf8')
    })

    it('should load tokens.json', () => {
      fs.readdirSync.mockReturnValue(['tokens.json'])
      fs.readFileSync.mockReturnValue('{}')

      Config.from('.', {}, {})

      expect(fs.readFileSync).toBeCalledWith('.dashund/tokens.json', 'utf8')
    })
  })

  describe('#parseZones', () => {
    it('should parse zones and store on self', () => {
      let input = {
        zone_a: [{ type: 'some_widget', name: 'geoff' }]
      }

      let config = new Config(widgetFactories, tokenFactories)
      config.parseZones(input)

      let widgets = config.zones.get('zone_a')

      expect(widgets).toHaveLength(1)
    })
  })

  describe('.parseToken', () => {
    it('should parse tokens and store on self', () => {
      let input = {
        some_service: { secret: 'password' }
      }

      let config = new Config(widgetFactories, tokenFactories)
      config.parseToken(input)

      let service = config.tokens.get('some_service')
      expect(service).toBeDefined()

      const { type, secret } = service
      expect(type).toEqual('some_service')
      expect(secret).toEqual('password')
    })
  })

  describe('#save', () => {
    it('should create the .dashund folder', () => {
      let config = new Config()

      // Pretend the directory doesn't exist
      fs.statSync.mockImplementation(() => {
        throw new Error()
      })

      config.save('test_path')

      expect(fs.mkdirSync).toHaveBeenCalledWith('test_path/.dashund', {
        recursive: true
      })
    })

    it('should save widgets', () => {
      let config = new Config()
      config.save('test_path')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test_path/.dashund/widgets.yml',
        expect.stringMatching(/\{\}/)
      )
    })

    it('should save tokens', () => {
      let config = new Config()
      config.save('test_path')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test_path/.dashund/tokens.json',
        expect.stringMatching(/\{\}/)
      )
    })
  })
})
