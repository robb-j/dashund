import yargs = require('yargs/yargs')
import ms = require('ms')

import * as express from 'express'
import * as cors from 'cors'
import * as WebSocket from 'ws'
import { createServer, Server } from 'http'

import {
  Config,
  Endpoint,
  TokenFactory,
  WidgetFactory,
  EndpointResult,
  validateTokenFactory,
  validateWidgetFactory,
  performEndpoint,
  performTokenRefresh
} from './core'

import { sharedLogger } from './utils'
import { defaultCommands } from './commands'

export type DashundOptions = {
  path: string
  hostname: string
  corsHosts: string[]
}

type Raw<T> = { [index: string]: T }

const defaultOptions = {
  path: process.cwd(),
  hostname: 'http://localhost',
  corsHosts: []
}

export class Dashund {
  widgetFactories: Map<string, WidgetFactory>
  tokenFactories: Map<string, TokenFactory>
  endpoints: Endpoint[]
  commands: any[]
  timers: NodeJS.Timeout[]
  endpointData: Map<string, EndpointResult>
  subscriptions: Map<string, WebSocket[]>
  options: DashundOptions

  /** Create a new dashund instance */
  constructor(
    widgets: Raw<WidgetFactory>,
    tokens: Raw<TokenFactory>,
    endpoints: Endpoint[],
    options: Partial<DashundOptions> = {}
  ) {
    this.widgetFactories = new Map(Object.entries(widgets))
    this.tokenFactories = new Map(Object.entries(tokens))
    this.endpoints = [...endpoints]
    this.commands = defaultCommands
    this.timers = []
    this.endpointData = new Map()
    this.subscriptions = new Map()

    this.options = { ...defaultOptions, ...options }

    // Make sure token factories are all subclasses
    for (let factory of this.tokenFactories.values()) {
      validateTokenFactory(factory)
    }

    // // Make sure token factories are all subclasses
    for (let factory of this.widgetFactories.values()) {
      validateWidgetFactory(factory)
    }
  }

  /** Run the CLI */
  async runCLI(args = process.argv.slice(2), cwd = process.cwd()) {
    // Setup the cli instance using yargs
    let cli = yargs(args)
      .help()
      .alias('help', 'h')
      .option('path', {
        describe: 'The path to your .dashund folder',
        default: process.cwd()
      })

    // Allow commands to register themselves
    for (let command of this.commands) command(cli, this)

    // Run the CLI
    let argv = cli.parse()

    // Fail if there was no command
    if (argv._[0] === undefined) {
      sharedLogger.error('Unknown command')
      process.exit(1)
    }
  }

  /** Run the server */
  async runServer(port: number) {
    // Fetch config
    let config = this.loadConfig(this.options.path)

    // Make sure everything is in tip-top shape
    this.runPreflightChecks(config)

    // Create an express app
    let app = express()
    let server = createServer(app)

    if (this.options.corsHosts.length > 0) {
      app.use(
        cors({
          origin: this.options.corsHosts
        })
      )
    }

    // Register JSON API middleware
    app.use(this.createAPIMiddleware(config))

    // Setup web sockets
    this.attachSocketServer(config, server)

    // Setup periodic timers for endpoints
    await this.setupTimers(config)

    // Return a promise to start the server
    return new Promise(resolve => server.listen(port, resolve))
  }

  /** Load dashund config with the current widget/token types */
  loadConfig(path: string) {
    return Config.from(path, this.widgetFactories, this.tokenFactories)
  }

  runPreflightChecks(config: Config) {
    // TODO: ensure widgets map to factories
    // TODO: ensure widgets have required endpoints & tokens
    // TODO: ensure tokens map to factories
    // TODO: ensure endpoints have required tokens
  }

  createAPIMiddleware(config: Config) {
    let router = express.Router()

    // Add a route to show widget/zone configuration
    router.get('/zones', (req, res) => {
      let payload: any[] = []

      config.zones.forEach((widgets, name) => {
        payload.push({ name, widgets })
      })

      res.send({ zones: payload })
    })

    // Add a route to show the available endpoints
    router.get('/endpoints', (req, res) => {
      let payload = []

      for (let { name, interval } of this.endpoints) {
        payload.push({ name, interval })
      }

      res.send({ endpoints: payload })
    })

    // EXPERIMENTAL: Add a route to show subscriptions
    router.get('/subs', (req, res) => {
      let payload: any = {}

      this.subscriptions.forEach((subs, name) => {
        payload[name] = subs.length
      })

      res.send({ subscriptions: payload })
    })

    // A lambda to format endpoint names into routes
    // e.g. /some/endpoint/ => /some/endpoint
    const sanitizeName = (name: string) =>
      '/' +
      name
        .replace(/^\//, '')
        .replace(/\/$/, '')
        .replace(/\s+/, '')

    // Register endpoint routes
    for (let endpoint of this.endpoints) {
      let { name, interval, handler } = endpoint

      router.get(sanitizeName(name), async (req, res) => {
        let result = this.endpointData.get(endpoint.name)

        if (!result) result = EndpointResult.notFound()

        res.status(result.status).send(result.serialize(name))
      })
    }

    return router
  }

  attachSocketServer(config: Config, httpServer: Server) {
    let wss = new WebSocket.Server({ server: httpServer })

    // Register events when new sockets connect
    wss.on('connection', ws => {
      ws.on('message', data => this.handleSocket(ws, data))
      ws.on('close', () => this.clearSocket(ws))
    })

    return wss
  }

  /** Setup endpoint timers to periodically poll data, store the result and update sockets */
  async setupTimers(config: Config) {
    for (let endpoint of this.endpoints) {
      // Create an interval to run the endpoint periodically
      let timerId = setInterval(
        () => this.runEndpoint(endpoint, config),
        ms(endpoint.interval)
      )

      // Store the timer id
      this.timers.push(timerId)

      // Initially run the endpoint
      await this.runEndpoint(endpoint, config)
    }

    // Add a timer check for dirty configs and save them
    setInterval(() => {
      if (!config.isDirty) return
      config.save(this.options.path)
      config.isDirty = false
    }, 5 * 1000)
  }

  /**
    Execute an endpoint and store the result (catching any errors)
    @param {Endpoint} endpoint
    @param {Config} config
   */
  async runEndpoint(endpoint: Endpoint, config: Config) {
    // Get the data from the endpoint
    let result = await performEndpoint(endpoint, config, performTokenRefresh)

    // Update the data cache
    this.endpointData.set(endpoint.name, result)

    // Fetch socket subscribers
    let subs = this.subscriptions.get(endpoint.name) || []

    // Update socket subscribers
    for (let sub of subs) {
      sub.send(JSON.stringify(result.serialize(endpoint.name)))
    }
  }

  /** Handle a data payload from a socket */
  handleSocket(socket: WebSocket, data: WebSocket.Data) {
    try {
      // Deconstruct the JSON payload
      let { type, ...params } = JSON.parse(data.toString())

      // Handle subscription messages
      if (type === 'sub') {
        let subs = this.subscriptions.get(params.target) || []
        subs.push(socket)
        this.subscriptions.set(params.target, subs)
      }

      // Handle unsubscribe messages
      if (type === 'unsub') {
        let subs = this.subscriptions.get(params.target) || []

        this.subscriptions.set(
          params.target,
          subs.filter(sub => sub !== socket)
        )
      }
    } catch (error) {
      sharedLogger.debug(error)
    }
  }

  /** Remove subscriptions for a socket */
  clearSocket(deadSocket: WebSocket) {
    this.subscriptions.forEach((subs, name) => {
      let filteredSubs = subs.filter(ws => ws !== deadSocket)
      this.subscriptions.set(name, filteredSubs)
    })
  }
}

module.exports = { Dashund }
