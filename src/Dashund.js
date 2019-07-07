const yargs = require('yargs/yargs')
const ms = require('ms')
const express = require('express')
const WebSocket = require('ws')
const { createServer } = require('http')

const { Config, Endpoint } = require('./core')
const {
  sharedLogger,
  MissingTokenError,
  ExpiredTokenError
} = require('./utils')
const { defaultCommands } = require('./commands')

class Dashund {
  /** Create a new dashund instance */
  constructor(widgets = {}, tokens = {}, endpoints = [], path = process.cwd()) {
    this.widgetFactories = new Map(Object.entries(widgets))
    this.tokenFactories = new Map(Object.entries(tokens))
    this.endpoints = endpoints.map(conf => new Endpoint(conf))
    this.commands = defaultCommands
    this.timers = []
    this.endpointData = new Map()
    this.subscriptions = new Map()
    this.configPath = path
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
  async runServer(port) {
    // Fetch config
    let config = this.loadConfig(this.configPath)

    // Create an express app
    let app = express()
    let server = createServer(app)

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
  loadConfig(path) {
    return Config.from(path, this.widgetFactories, this.tokenFactories)
  }

  /** @param {Config} config */
  createAPIMiddleware(config) {
    let router = express.Router()

    // Add a route to show widget/zone configuration
    router.get('/zones', (req, res) => {
      let payload = []

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
      let payload = {}

      this.subscriptions.forEach((subs, name) => {
        payload[name] = subs.length
      })

      res.send({ subscriptions: payload })
    })

    // A lambda to format endpoint names into routes
    // e.g. /some/endpoint/ => /some/endpoint
    const sanitizeName = name =>
      '/' +
      name
        .replace(/^\//, '')
        .replace(/\/$/, '')
        .replace(/\s+/, '')

    // Register endpoint routes
    for (let endpoint of this.endpoints) {
      let { name, interval, handler } = endpoint

      router.get(sanitizeName(name), async (req, res) => {
        res.send({ data: this.endpointData.get(endpoint.name) })
      })
    }

    return router
  }

  /** @param {Config} config */
  attachSocketServer(config, httpServer) {
    let wss = new WebSocket.Server({ server: httpServer })

    // Register events when new sockets connect
    wss.on('connection', ws => {
      ws.on('message', data => this.handleSocket(ws, data))
      ws.on('close', () => this.clearSocket(ws))
    })

    return wss
  }

  /** Setup endpoint timers to periodically poll data, store the result and update sockets */
  async setupTimers(config) {
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
      config.save(this.configPath)
      config.isDirty = false
    }, 5 * 1000)
  }

  /** Execute an endpoint and store the result (catching any errors) */
  async runEndpoint(endpoint, config, attemptReauth = true) {
    try {
      // Ensure required tokens are set and gather them into an array
      for (let tokenName of endpoint.requiredTokens) {
        let token = config.tokens.get(tokenName)
        if (!token) throw new MissingTokenError(tokenName)
        await this.renewToken(token, config)
      }

      // Fetch data using the handler
      let data = await endpoint.handler({
        zones: config.zones,
        tokens: config.tokens
      })

      // Update the data cache
      this.endpointData.set(endpoint.name, data)

      // Fetch socket subscribers
      let subs = this.subscriptions.get(endpoint.name) || []

      // Update socket subscribers
      for (let sub of subs) {
        sub.send(
          JSON.stringify({
            type: endpoint.name,
            data: data
          })
        )
      }
    } catch (error) {
      sharedLogger.warn(error)
    }
  }

  /** Handle a data payload from a socket */
  handleSocket(socket, data) {
    try {
      // Deconstruct the JSON payload
      let { type, ...params } = JSON.parse(data)

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
  clearSocket(deadSocket) {
    this.subscriptions.forEach((subs, name) => {
      let filteredSubs = subs.filter(ws => ws !== deadSocket)
      this.subscriptions.set(name, filteredSubs)
    })
  }

  /** Try to renew a token and save changes if it changed */
  async renewToken(token, config) {
    let tokenFactory = this.tokenFactories.get(token.type)
    if (typeof tokenFactory.reauth !== 'function') return

    try {
      let newToken = await tokenFactory.reauth(token)
      if (!newToken) return

      config.tokens.set(token.type, {
        type: token.type,
        ...newToken
      })

      config.isDirty = true
    } catch (error) {
      sharedLogger.debug(error)
      throw new ExpiredTokenError(token.type)
    }
  }
}

module.exports = { Dashund }
