import { mocked } from 'ts-jest/utils'

import {
  Endpoint,
  validateEndpoint,
  EndpointResult,
  performEndpoint
} from '../endpoint'

import { TokenFactory } from '../token'
import { Config } from '../config'
import { ReauthError } from '../../utils'

describe('EndpointResult', () => {
  describe('.withData', () => {
    it('should store the data with a status of 200', () => {
      let res = EndpointResult.withData({ name: 'Geoff' })

      expect(res.status).toEqual(200)
      expect(res.data).toEqual({ name: 'Geoff' })
    })
  })

  describe('.notFound', () => {
    it('should store no data with a status of 404', () => {
      let res = EndpointResult.notFound()

      expect(res.status).toEqual(404)
      expect(res.data).toEqual(null)
    })
  })

  describe('.notAuthenticated', () => {
    it('should store no data with a status of 401', () => {
      let res = EndpointResult.notAuthenticated()

      expect(res.status).toEqual(401)
      expect(res.data).toEqual(null)
    })
  })

  describe('#serialize', () => {
    it('should return an object with the name, data and status', () => {
      let res = new EndpointResult({ name: 'Geoff' }, 200)
      let value = res.serialize('my_endpoint')

      expect(value.type).toEqual('my_endpoint')
      expect(value.status).toEqual(200)
      expect(value.data).toEqual({ name: 'Geoff' })
    })
  })
})

describe('#validateEndpoint', () => {
  it('should validate interval is an ms value', () => {
    let init = () =>
      validateEndpoint({
        name: 'a',
        interval: 'xxx',
        handler: jest.fn(),
        requiredTokens: []
      })

    expect(init).toThrow(/Expected 'interval' to be string/i)
  })
})

describe('#performEndpoint', () => {
  let endpoint: Endpoint
  let tokenFactory: TokenFactory
  let config: Config

  beforeEach(() => {
    endpoint = {
      name: 'test/endpoint',
      interval: '5ms',
      handler: jest.fn(async () => ({ some: 'data' })),
      requiredTokens: ['MockToken']
    }

    tokenFactory = {
      createFromCLI: jest.fn(),
      hasExpired: jest.fn(() => false),
      refreshToken: jest.fn(async () => undefined)
    }

    config = new Config()
    config.tokenFactories.set('MockToken', tokenFactory)
    config.tokens.set('MockToken', { type: 'MockToken' })
  })

  it('should return the data', async () => {
    let result = await performEndpoint(endpoint, config)
    expect(result.status).toEqual(200)
    expect(result.data).toEqual({ some: 'data' })
  })

  it('should refresh expired tokens', async () => {
    tokenFactory.hasExpired = jest.fn(() => true)
    let spy = jest.fn()

    await performEndpoint(endpoint, config, spy)

    expect(spy).toBeCalled()
  })

  it('should refresh tokens when a ReauthError is thrown', async () => {
    mocked(endpoint.handler).mockRejectedValueOnce(new ReauthError('MockToken'))

    let spy = jest.fn()
    let result = await performEndpoint(endpoint, config, spy)

    expect(spy).toBeCalled()
    expect(result.data).toEqual({ some: 'data' })
  })
})
