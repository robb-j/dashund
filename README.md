# Dashund / dachshund

Tools for making dashboards as simple and quick as possible

<!-- toc-head -->

## Table of contents

- [What is this?](#what-is-this)
- [Project components](#project-components)
- [File structure](#file-structure)
  - [The CLI](#the-cli)
  - [The API](#the-api)
    - [A Token](#a-token)
    - [A Widget](#a-widget)
    - [An endpoint](#an-endpoint)
    - [Configuring dashund](#configuring-dashund)

<!-- toc-tail -->

## What is this?

Dashund is a framework for creating dashboards, aiming at doing the boring parts
of authenticating and connecting RESTful APIs together and re-serving content.

Say you connect to Spotify to get songs using their RESTful API
and you want to show whats playing on a screen.
You create a `Token` in Dashund to handle the auth process
and an `Endpoint` to poll for data at a set interval.

You use the CLI to create an authentication using your `Token`.
Then you run dashund as a server which performs your `Endpoint`s using those tokens
(re-authenticating when needed) and re-serve the responses over http and publish `WebSocket` events.

> The CLI is designed to be run accross SSH so you can perform web-based hooks
> on your local machine and store the values on your remote server.
> I.E. doing a OAuth2 web flow and storing the tokens back on the server

Your web app can now initially fetch the value using the http API
and subscribe to WebSocket events to be pushed new values.

## Project components

- A CLI for managing widgets within zones
- A CLI for authenticating with 3rd party services and storing access tokens
- An API for reading in widgets, zones and tokens
- An API for scaffolding an http JSON RESTful API
- An API for scaffolding a socket based subscription to endpoints
- UI utilities to subscribe to the sockets (WIP)
- UI components for rendering widgets in zones (WIP)

## File structure

Dashund stores access tokens and widgets locally, wherever you are running it,
in a folder called `.dashund`

```bash
dashund.js     # module.exports = new Dashund(...)
cli.js         # imports dashund and calls runCLI(...)
server.js      # imports dashund and calls runServer(...)
.dashund
  widgets.yml  # YAML config for where widgets are stored
  tokens.json  # JSON config for access tokens
```

### The CLI

The CLI is designed to be interactive-first, to provide the best human experience.
Its inspired by kubernete's resource-based approach with the resources being
`Token`, `Widget` and `Zone`.

```
Usage: dashund <command>

Commands:
  cli.js get            Display resources
  cli.js create [type]  Create a new resource
  cli.js check          Check token authentication
  cli.js serve [port]   Run the dashund server

Options:
  --version   Show version number                                      [boolean]
  --help, -h  Show help                                                [boolean]
  --path      The path where your .dashund folder is              [default: cwd]
```

### The API

#### A Token

First you'll want a token, a factory for authenticating to a 3rd party service,
e.g. **tokens.js**

```js
const { runTemporaryServer } = require('dashund')
const axios = require('axios')

exports.GitHub = {
  //
  // A method for creating the token, with user input
  // and potentially a temporary server for handling callbacks
  //
  async createFromCLI(dashund) {
    const callbackURL = dashund.makeCallbackURL()
    console.log(`Visit ${callbackURL}`)

    let token = null
    await runTemporaryServer(3000, (app, close) => {
      app.get('/', (req, res) => res.redirect('...'))
      app.post('/callback', (req, res) => {
        token = req.body
        res.send('Go back to the terminal!')
        close()
      })
    })
    return token
  },

  //
  // A second method for letting dashund know when that token has expired
  //
  hasExpired(token) {
    return token.expiresAt < Date.now()
  },

  //
  // A third method for re-authenticating if a token becomes invalid / expires
  // - This can't have user input
  //
  async refreshToken(token) {
    let res = await axios.post('...', {
      refresh_token: token.refreshToken
    })
    return res.data
  }
}
```

#### A Widget

Second you'll need a widget which will render things on the front end,
e.g. **widgets.js**

```js
exports.GitHubActivity = {
  requiredEndpoints = ['github/activity']

  create({ title = '' }) {
    return { title }
  }

  async createFromCLI() {
    const { title } = await prompts({
      type: 'string',
      name: 'title',
      message: 'Widget name'
    })

    return { title }
  }
}
```

#### An endpoint

Third create endpoints which use the tokens to fetch data,
e.g. **endpoints.js**

```js
const axios = require('axios')

module.exports = [
  {
    name: 'github/activity',
    requiredTokens: ['GitHub'],
    interval: '5m',
    handler: async ctx => {
      let { accessToken } = ctx.tokens.get('GitHub')
      let headers = { authorization: `Bearer ${accessToken}` }
      let res = await axios.get('...', { headers })
      return res.data
    }
  }
]
```

#### Configuring dashund

Next, create your instance, e.g. **dashund.js**

```js
const { Dashund } = require('dashund')

// Import your token and widget factories and endpoints
const widgets = require('./widgets')
const tokens = require('./tokens')
const endpoints = require('./endpoints')

// Export an instance of Dashund
module.exports = new Dashund(widgets, tokens, endpoints)
```

Then create a CLI entrypoint, **cli.js**

```js
const dashund = require('./dashund')
dashund.runCLI()
```

Finally create a server entrypoint, **server.js**

```js
const dashund = require('./dashund')

;async () => {
  await dashund.runServer(3000)
  console.log('Listening on :3000')
}
```

Now you can run the cli with `node cli.js` and the server with `node server.js`.

### Example usage

Here are some example requests with [httpie](https://httpie.org/)

```bash
# Fetch a specify resource, calling it's handler
http https://dashboard.io/github/activity
```

Example socket subscriptions with [akita-ws](https://github.com/robb-j/akita):

```bash
akita wss://dashboard.io
> {"type": "subscribe", "name": "github/activity"}
> {"type": "unsubscribe", "name": "github/activity"}
```
