# Dachshund / dashund

Tools for making dashboards as simple and quick as possible

> This document is currently an exploration into what this project could be.
> It scopes our the ideas and interfaces it could implement.

## Project components

- A CLI for managing widgets within zones
- A CLI for authenticating third party services
- An API for reading widgets and authorizations (authz)
- An API for scaffolding an http API with socket based subscriptions
- UI components for rendering widgets
- UI tools for subscribing to sockets and re-rendering

In this document:

- Authentication (authn) is the process of prooving who you are.
- Authorization (authz) is the proof you received when authentication.

## How it should work

There will be a CLI for configuring widgets in groups (zones) and authenticating with third party services.
There will be an API library for reading in widget/authorization files and scaffolding an api with web sockets.
There will be a UI library for rendering widgets which subscribe to the api's web sockets.

## CLI Usage

```
Usage: dashund [options] <command>

Options:
  -f --file  Specify where your .dashund folder is

Commands:
  get <widget|auth|zone> [identifier]     Get an existing resource
  create <widget|auth|zone> <identifier>  Create a new resource
  delete <widget|auth|zone> <identifier>  Delete a resource

  refreshAuth                             Refresh any expired authorization
  move <identifier> <destination> <pos>   Move a widget to a new zone/position
```

Which should create a filestructure like:

```bash
.dashund/
  widgets.yml
  authorizations.json
```

## The API

The base types

```ts
interface Component<T = any> {
  id: string
  config: T

  async configureFromCLI() { }
  async validateConfiguration(config: T) { }
}

class Widget<T> implements Component<T> {
  authorizations = new Array<string>()

  constructor(public id: string, public config: T) {}
}
class Authorization<T> implements Component<T> {
  constructor(public id: string, public config: T) {}
}
```

An example widget

```ts
export type GitHubActiviyConfig = {
  name: string
}

export class GitHubActivityWidget implements Widget<GitHubActiviyConfig> {
  authorizations = ['github']

  async configureFromCLI() {
    const { name } = await prompts([
      {
        type: 'string',
        name: 'name',
        message: 'What is the name of this component'
      }
    ])

    this.config = { name }
  }

  async validateConfiguration(config) {
    if (!config.name) throw new Error('Name is required')
  }
}
```

Configure your instance, **dashund.ts**

```js
import { Dashund } from 'dashund'

import { TrelloAuthz, MonzoAuthz, GitLabAuthz } from './authorizations'
import { TrelloListWidget, MonzoBalanceWidget } from './widgets'

export const dashund = new Dashund({
  authorizations: { TrelloAuthz, MonzoAuthz, GitLabAuthz },
  widgets: { TrelloListWidget, MonzoBalanceWidget }
})
```

Create a cli entrypoint, **cli.ts**

```ts
import { dashund } from './dashund'
dashund.runCLI(process.argv, process.cwd())
```

Run your own api

```js
import { dashund } from './dashund'

let config = await dashund.parseConfig(process.cwd())

config.zones // Map<string, Zone[]>
config.authorizations // Map<string, Authorization[]>

let app = express()

app.use(
  dashund.createApi(config, [
    {
      name: 'gitlab/ci-jobs',
      interval: '5m',
      handler: async ctx => {
        ctx.zones // Map<string, Zone>
        ctx.authorizations // Map<string, Authorization>

        return { msg: 'Hello, world!' }
      }
    }
  ])
)

app.listen(3000, resolve)
```

Example requests with [httpie](https://httpie.org/):

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

---

Exploring modular cli commands

```js
class CommandLine {
  commands = []

  addModule(command) {
    this.commands.push(command)
  }

  runCLI(cwd = process.cwd()) {
    for (let cmd of this.commands) {
      let yargs = new Yargs()
    }
  }
}

class Command {
  configure(yargs, config = null) {}

  wrapWithErrorHandler(block) {
    return async (...args) => {
      try {
        await block(...args)
      } catch (error) {
        console.log(error.message)
        console.log(error.stack.split('\n')[1])
      }
    }
  }

  loadConfig() {}
}

class GetCommand extends Command {
  configure(cli) {
    cli.yargs
      .command('get <type> [id]')
      .action(this.catchAndLog((type, id) => this.exec(cli.cwd, type, id)))
  }

  async exec(cwd, type, id) {
    console.log(config)
  }
}
```
