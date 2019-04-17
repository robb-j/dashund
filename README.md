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

* Authentication (authn) is the process of prooving who you are.
* Authorization (authz) is the proof you received when authentication.

## How it should work

There will be a CLI for configuring widgets in groups (zones) and authenticating with third party services.
There will be an API library for reading in widget/authorization files and scaffolding an api with web sockets.
There will be a UI library for rendering widgets which subscribe to the api's web sockets.

## The CLI

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
  
  static configureFromCLI(): Component { }
  validateConfiguration(config: T) { }
}

class Widget<T> implements Component<T> {}
class Authorization<T> implements Component<T> {}
```

Build your own CLI, **cli.ts**, for example:

```ts
import { TrelloAuthz, MonzoAuthz, GitLabAuthz } from './authorizations'
import { TrelloListWidget, MonzoBalanceWidget } from './widgets'
import { createCli } from 'dashund'

createCli({
  authorizations: { TrelloAuthz, MonzoAuthz, GitLabAuthz },
  widgets: { TrelloListWidget, MonzoBalanceWidget }
})
```

Run your own api

```js
import {
  parseDashConfig,
  createDashundApi,
  DashConfig,
  Zone,
  Widget,
  Authorization
} from 'dashund'

// Look at `pwd`/.dashund by default
let config = await parseDashConfig({
  authorities: { TrelloAuthority, GitLabAuthority },
  widgets: { TrelloListWidget, GitLabJobsWidget }
})

config.zones // Map<string, Zone[]>
config.authorizations // Map<string, Authorization[]>

let app = express()

app.use(createDashundApi(config, [
  {
    name: 'gitlab/ci-jobs',
    interval: '5m',
    handler: async ctx => {
      
      ctx.zones // Map<string, Zone>
      ctx.authorizations // Map<string, Authorization>
      
      return { msg: 'Hello, world!' }
    }
  }
]))

await new Promise(resolve => app.listen(3000, resolve))
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
