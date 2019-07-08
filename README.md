# Dashund / dachshund

Tools for making dashboards as simple and quick as possible

> This document is an exploration into what the project could be
> It aims to scope out the initial features.

## Project components

- A CLI for managing widgets within zones
- A CLI for authenticating with 3rd party services and storing access tokens
- An API for reading in widgets, zones and tokens
- An API for scaffolding an http JSON RESTful API
- An API for scaffolding a socket based subscription to endpoints
- UI utilities to subscribe to the sockets (WIP)
- UI components for rendering widgets in zones (WIP)

## How it should work

> Dashund **is not** an all in one solution, its more of a framework for scaffolding your own solution.
> It aims at reducing the code you write as much as possible, but not entirely.

A CLI is used to configure zones of the dashboard and put widgets in them.
The CLI is also authenticates with 3rd party services and stores and refreshes access tokens.

It creates a file structure like this:

```
.dashund
  widgets.yml
  tokens.json
```

There is then an API to read in the configuration generated from the CLI
and allow you to scaffold an API using those tokens with web socket subscriptions.

There is finally UI tools to subscribe to those endpoints
and utilities to render widgets within their zones.

### The CLI

```
Usage: dashund <command>

Commands:
  cli.js get                         Get a Dashund resource from the local .dashund folder
  cli.js create <zone|widget|token>  Create a dashund resource

Options:
  --version   Show version number                                      [boolean]
  --help, -h  Show help                                                [boolean]
  --path      The path to your .dashund folder

```

### The API

First you'll want a token, a factory for authenticating to a 3rd party service,
e.g. **tokens.js**

```js
const { runTemporaryServer } = require('dashund')
const axios = require('axios')

exports.GitHub = {
  //
  // One method for creating the token, with user input
  // and a temporary server for handling callbacks
  //
  async createFromCLI() {
    console.log('Visit http://localhost:3000')

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
  // A second method for re-authenticating if a token becomes invalid / expires
  // - This can't have user input
  //
  async reauthenticate(token) {
    if (token.expiry > Date.now()) return
    let res = await axios.post('...')
    return res.data
  }
}
```

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
      let params = { token: ctx.tokens.get('GitHub') }
      let res = await axios.get('...', { params })
      return res.data
    }
  }
]
```

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

Example requests with [httpie](https://httpie.org/)

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
