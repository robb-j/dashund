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
- UI utilities to subscribe to the sockets
- UI components for rendering widgets in zones

## How it should work

A CLI is used to configure zones of the dashboard and put widgets in them.
The CLI is also used to authenticate with 3rd party services and store and refresh access tokens.

It should create a file structure like this:

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
Usage: dashund [options] <command>

Options:
  -f --file  Specify a different .dashund folder

Commands:
  get <token|zone> [identifier]
  create <zone|widget|token> [identifier]
  delete <zone|widget|token> [identifier]
  refreshTokens
```

### The API

```ts
type Config = {
  widgets: Map<string, WidgetConfigurator>
  services: Map<string, Configurator>
}

interface Configurator<T = any> {
  create(initial: any): T
  createFromCLI(): Promise<T>
  validateConfig(values: any): boolean
}
interface WidgetConfigurator extends Configurator {
  requiredTokens: string[]
}
```

```js
class GitHubActivityWidget implements WidgetConfigurator {
  requiredTokens = ['github']
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

Create your instance, **dashund.js**

```js
const { Dashund } = require('dashund')

const { TrelloToken, MonzoToken, GitLabToken } = require('./tokens')
const { TrelloListWidget, MonzoBalanceWidget } = require('./widgets')

module.exports = new Dashund({
  tokens: { TrelloToken, MonzoToken, GitLabToken },
  widgets: { TrelloListWidget, MonzoBalanceWidget }
})
```

Create a CLI entrypoint, **cli.js**

```js
const dashund = require('./dashund')
dashund.runCLI()
```

Create an API entrypoint, **server.js**

```js
const axios = require('axios')
const express = require('express')

const dashund = require('./dashund')

;(async () => {
  let config = await dashund.parseConfig()
  config.zones // Map<string, Widget[]>
  config.tokens // Map<string, Token>

  let app = express()

  app.use(
    dashund.createAPI(config, [
      {
        name: 'gitlab/ci-jobs',
        interval: '5m',
        handler: async ctx => {
          ctx.zones // Map<string, Widget[]>
          ctx.tokens // Map<string, Token>

          let params = { token: ctx.tokens.get('gitlab').secret }
          let res = await axios.get(
            'https://gitlab.com/api/v4/projects/51/jobs',
            { params }
          )

          return { jobs: res.data }
        }
      }
    ])
  )

  app.listen(3000)
})()
```

Example requests with [httpie](https://httpie.org/)

```bash
# Fetch a specify resource, calling it's handler
http https://dashboard.io/gitlab/ci-jobs
```

Example socket subscriptions with [akita-ws](https://github.com/robb-j/akita):

```bash
akita wss://dashboard.io
> {"type": "subscribe", "name": "gitlab/ci-jobs"}
> {"type": "unsubscribe", "name": "gitlab/ci-jobs"}
```
