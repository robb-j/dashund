import { mocked } from 'ts-jest/utils'

import { WidgetFactory } from '../widget'
import { TokenFactory } from '../token'

import * as fs from 'fs'
import { Config } from '../config'

jest.mock('fs')

describe('Config', () => {
  let widgetFactories: Map<string, WidgetFactory>
  let tokenFactories: Map<string, TokenFactory>

  beforeEach(() => {
    widgetFactories = new Map()
    tokenFactories = new Map()

    widgetFactories.set('some_widget', {
      createFromCLI: jest.fn(),
      requiredEndpoints: [],
      requiredTokens: []
    })
  })

  describe('.from', () => {
    it('should load widgets.yml', () => {
      mocked<any>(fs.readdirSync).mockReturnValue(['widgets.yml'])
      mocked(fs.readFileSync).mockReturnValue('{}')

      Config.from('.')

      expect(fs.readFileSync).toBeCalledWith('.dashund/widgets.yml', 'utf8')
    })

    it('should load tokens.json', () => {
      mocked<any>(fs.readdirSync).mockReturnValue(['tokens.json'])
      mocked(fs.readFileSync).mockReturnValue('{}')

      Config.from('.')

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

      let service = config.tokens.get('some_service')!
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
      mocked(fs.statSync).mockImplementation(() => {
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
