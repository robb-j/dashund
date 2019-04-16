# Dachshund / dashund

Tools for making dashboards as simple and quick as possible

## Project components

- A CLI for managing widgets in zones
- A CLI for authenticating services
- An API for reading widgets and authorizations (authz)
- An API for scaffolding an http API with socket based subscriptions
- UI components for rendering widgets
- UI tools for subscribing to sockets and re-rendering

In this document:

* Authentication (authn) is the process of prooving who you are.
* Authorization (authz) is the proof you received when authentication.

## The CLI

```bash
Usage: dashund [options] <command> <subcommand>

Commands:

  get <widget/auth/zone> [identifier]    – Get an existing resource
  create <widget/auth/zone>              – Create a new resource
  delete <widget/auth/zone> <identifier> – Delete a resource
  
  refreshAuth – Refresh any expired authz authorization
```

## The API

```ts
import {
  parseDashConfig,
  parseWidgets,
  parseAuthorizations,
  createHttpApi,
  DashConfig,
  Zone,
  Widget,
  Authorization
} from 'dashund'

let config = await parseDashConfig('.dashund') // A folder w/ widgets.yml and authz.json
config.zones // Zone[]
config.authorizations // Authorization[]

let server = createHttpApi([
  {
    name: 'gitlab/ci-jobs',
    interval: '5m',
    handler: async ctx => {
      ctx.res.send('...')
    }
  }
])

await server.start(3000)
```

Example requests with [httpie](https://httpie.org/):

```bash
http https://dashboard.io/gitlab/ci-jobs
```

Example socket subscriptions with [akita-ws](https://github.com/robb-j/akita):

```bash
akita wss://dashboard.io
> {"type": "subscribe", "name": "gitlab/ci-jobs"}
> {"type": "unsubscribe", "name": "gitlab/ci-jobs"}
```
