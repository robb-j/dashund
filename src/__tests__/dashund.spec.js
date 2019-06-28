const request = require('supertest')
const express = require('express')
const { Dashund } = require('../dashund')
const { Config, Endpoint } = require('../core')

jest.useFakeTimers()

const mockEndpoint = () => ({
  name: 'test/endpoint',
  interval: '10m',
  handler: jest.fn(() => 'hello_world')
})

describe('Dashund', () => {
  let dashund, config, endpoint

  beforeEach(() => {
    config = new Config()
    config.tokens.set('TestToken', { secret: 'some_secret_value' })
    config.zones.set('left', [
      { type: 'WidgetA', name: 'geoff' },
      { type: 'WidgetB', name: 'tim' }
    ])

    endpoint = mockEndpoint()

    dashund = new Dashund({}, {}, [endpoint])
  })

  describe('#createAPIMiddleware', () => {
    let app, agent
    beforeEach(() => {
      app = express()
      agent = request(app)

      app.use(dashund.createAPIMiddleware(config))
    })

    describe('GET /zones', () => {
      it('should succeed', async () => {
        let res = await agent.get('/zones')
        expect(res.status).toEqual(200)
      })
      it('should return the zones', async () => {
        let res = await agent.get('/zones')

        expect(res.body.zones).toHaveLength(1)
        expect(res.body.zones).toContainEqual({
          name: 'left',
          widgets: expect.any(Array)
        })
      })
      it("should return a zone's widgets", async () => {
        let res = await agent.get('/zones')

        let { widgets } = res.body.zones[0]

        expect(widgets).toContainEqual({
          type: 'WidgetA',
          name: 'geoff'
        })
        expect(widgets).toContainEqual({
          type: 'WidgetB',
          name: 'tim'
        })
      })
    })

    describe('GET /endpoints', () => {
      it('should return endpoints', async () => {
        let res = await agent.get('/endpoints')

        expect(res.body.endpoints).toContainEqual({
          name: 'test/endpoint',
          interval: '10m'
        })
      })
    })

    it('should register endpoints', async () => {
      dashund.endpointData.set('test/endpoint', 'some_value')

      let res = await agent.get('/test/endpoint')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({ data: 'some_value' })
    })
  })

  describe('#handleSocket', () => {
    it('should handle JSON errors', () => {
      let handle = () => dashund.handleSocket(jest.fn(), '/something_not+json')
      expect(handle).not.toThrow()
    })

    describe('type=sub', () => {
      it('should store the subscription', () => {
        let socket = jest.fn()

        let body = JSON.stringify({ type: 'sub', target: 'test/endpoint' })
        dashund.handleSocket(socket, body)

        let subs = dashund.subscriptions.get('test/endpoint')
        expect(subs).toContain(socket)
      })
    })

    describe('type=unsub', () => {
      it('should unstore the subscription', () => {
        let socket = jest.fn()

        dashund.subscriptions.set('test/endpoint', [socket])

        let body = JSON.stringify({ type: 'unsub', target: 'test/endpoint' })
        dashund.handleSocket(socket, body)

        let subs = dashund.subscriptions.get('test/endpoint')
        expect(subs).not.toContain(socket)
      })
    })
  })

  describe('#setupTimers', () => {
    it('should register timers for endpoints', async () => {
      await dashund.setupTimers(config)

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        10 * 60 * 1000
      )
    })

    it('should store interval ids', async () => {
      await dashund.setupTimers(config)

      expect(dashund.timers).toHaveLength(1)
    })

    it('should run the endpoints', async () => {
      await dashund.setupTimers(config)

      expect(endpoint.handler).toHaveBeenCalled()
    })
  })

  describe('#runEndpoint', () => {
    it('should execute the handler', async () => {
      await dashund.runEndpoint(new Endpoint(endpoint), config)

      expect(endpoint.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          zones: config.zones,
          tokens: config.tokens
        })
      )
    })

    it('should store the result', async () => {
      await dashund.runEndpoint(new Endpoint(endpoint), config)

      expect(dashund.endpointData.get('test/endpoint')).toEqual('hello_world')
    })

    it('should notify subscriptions', async () => {
      let sub = { send: jest.fn() }
      dashund.subscriptions.set('test/endpoint', [sub])

      await dashund.runEndpoint(new Endpoint(endpoint), config)

      let expected = JSON.stringify({
        type: 'test/endpoint',
        data: 'hello_world'
      })
      expect(sub.send).toHaveBeenCalledWith(expected)
    })

    it('should reauth expired tokens that are required', () => {
      // TODO: ...
    })

    it('should reauth if a ReauthError is thrown', () => {
      // TODO ...
    })
  })

  describe('#clearSocket', () => {
    it('should remove instances of the socket', () => {
      let sub = jest.fn()
      dashund.subscriptions.set('test/endpoint', [sub])

      dashund.clearSocket(sub)

      expect(dashund.subscriptions.get('test/endpoint')).not.toContain(sub)
    })
  })
})
