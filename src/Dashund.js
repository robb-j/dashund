const yargs = require('yargs/yargs')
const ms = require('ms')
const express = require('express')
const WebSocket = require('ws')
const { createServer } = require('http')

const { Config } = require('./core/config')

const { defaultCommands } = require('./commands')

const pingInterval = ms('1s')

class Dashund {
  /** Create a new dashund instance */
  constructor(widgets = {}, tokens = {}, endpoints = []) {
    this.widgetTypes = new Map(Object.entries(widgets))
    this.tokenTypes = new Map(Object.entries(tokens))
    this.endpoints = endpoints
    this.commands = defaultCommands
    this.timers = []
    this.endpointData = new Map()
    this.subscriptions = new Map()

    // Validate each endpoint
    for (let i in endpoints) {
      let endpoint = endpoints[i]
      let fail = msg => {
        throw new Error(`endpoint[${i}]: ${msg}`)
      }

      if (typeof endpoint.name !== 'string') fail('invalid name')
      if (typeof endpoint.interval !== 'string') fail('invalid interval')
      if (typeof endpoint.handler !== 'function') fail('invalid handler')

      try {
        ms(endpoint.interval)
      } catch (error) {
        fail('invalid handler')
      }
    }
  }

  /** Run the CLI */
  async runCLI(args = process.argv.slice(2), cwd = process.cwd()) {
    let cli = yargs(args)
      .help()
      .alias('help', 'h')
      .option('path', {
        describe: 'The path to your .dashund folder',
        default: process.cwd()
      })

    for (let command of this.commands) command(cli, this)

    let argv = cli.parse()

    if (argv._[0] === undefined) {
      console.log('Unknown command')
      process.exit(1)
    }
  }

  /** Run the server */
  async runServer(port, path = process.cwd()) {
    // Fetch config
    let config = this.loadConfig(path)

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
    return Config.from(path, this.widgetTypes, this.tokenTypes)
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

    // Add a route to show subscriptions
    router.get('/subs', (req, res) => {
      let payload = {}

      this.subscriptions.forEach((subs, name) => {
        payload[name] = subs.length
      })

      res.send({ subscriptions: payload })
    })

    // A lambda to clean format endpoint routes
    // e.g. /some/endpoint/ => /some/endpoint
    const sanitizeName = name =>
      '/' + name.replace(/^\//, '').replace(/\/$/, '')

    // Register endpoint routes
    for (let endpoint of this.endpoints) {
      let { name, interval, handler } = endpoint

      router.get(sanitizeName(name), async (req, res, next) => {
        res.send({ data: this.endpointData.get(endpoint.name) })
      })
    }

    return router
  }

  /** @param {Config} config */
  attachSocketServer(config, httpServer) {
    let wss = new WebSocket.Server({ server: httpServer })

    //
    // Listen for new WebSocket connections
    //
    wss.on('connection', ws => {
      // Mark the socket as active
      ws.isAlive = true

      // For each new connection, listen for messages from it
      ws.on('message', data => {
        try {
          // Deconstruct the JSON payload
          let { type, ...params } = JSON.parse(data)

          // Handle subscription messages
          if (type === 'sub') {
            let subs = this.subscriptions.get(params.target) || []
            subs.push(ws)
            this.subscriptions.set(params.target, subs)
          }

          // Handle unsubscribe messages
          if (type === 'unsub') {
            let subs = this.subscriptions.get(params.target) || []

            this.subscriptions.set(
              params.target,
              subs.filter(sub => sub !== ws)
            )
          }
        } catch (error) {
          console.log(error)
        }
      })

      ws.on('pong', () => {
        ws.isAlive = true
      })
    })

    //
    // Setup a ping-pong to ensure sockets are active
    //
    // setInterval(() => {
    //   let count = 0
    //
    //   for (let ws of wss.clients) {
    //     console.log(ws.isAlive)
    //     if (ws.isAlive === false) {
    //       console.log('killed')
    //       ws.terminate()
    //       this.clearSocket(ws)
    //       count++
    //     } else {
    //       ws.isAlive = false
    //       ws.ping()
    //     }
    //   }
    //
    //   if (count > 0) {
    //     console.log(`Purged ${count} sockets`)
    //   }
    // }, pingInterval)

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
  }

  /** Execute an endpoint and store the result (catching any errors) */
  async runEndpoint(endpoint, config) {
    try {
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
      console.log(`Error: ${endpoint.name}`)
      console.log(error)
    }
  }

  clearSocket(deadSocket) {
    this.subscriptions.forEach((subs, name) => {
      this.subscriptions.set(
        this.subscriptions.get(name).filter(ws => ws !== deadSocket)
      )
    })
  }
}

module.exports = { Dashund }
