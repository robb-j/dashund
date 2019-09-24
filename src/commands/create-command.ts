import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'
import prompts = require('prompts')

type Params = DefaultCLIArgs & { type?: string }

interface Handler {
  (d: Dashund, argv: Arguments<Params>): Promise<void>
}

function mapKeysToChoices(map: Map<string, any>) {
  let choices = new Array<prompts.Choice>()

  for (let key of map.keys()) {
    choices.push({ title: key, value: key })
  }

  return choices
}

export const handlers = new Map<string, Handler>()

handlers.set('token', async (dashund, argv) => {
  let config = dashund.loadConfig(argv.path)

  const { type } = await prompts({
    type: 'select',
    name: 'type',
    message: 'Token type',
    choices: mapKeysToChoices(config.tokenFactories)
  })

  if (!type) throw new Error('Cancelled')

  if (config.tokens.has(type)) {
    let { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Token already exists, overwrite it?'
    })

    if (!confirm) return
  }

  let factory = config.tokenFactories.get(type)!

  let token = await factory.createFromCLI(dashund)

  config.tokens.set(type, {
    type: type,
    ...token
  })

  config.save(argv.path)
})

handlers.set('widget', async (dashund, argv) => {
  let config = dashund.loadConfig(argv.path)

  if (config.zones.size === 0) throw new Error('No zones')

  const { zone, type, identifier } = await prompts([
    {
      type: 'select',
      name: 'type',
      message: 'Widget type',
      choices: mapKeysToChoices(config.widgetFactories)
    },
    {
      type: 'select',
      name: 'zone',
      message: 'Pick a zone',
      choices: mapKeysToChoices(config.zones)
    },
    {
      type: 'text',
      name: 'identifier',
      message: 'Widget identifier'
    }
  ])

  if (!zone || !type) throw new Error('Cancelled')

  let factory = dashund.widgetFactories.get(type)!

  // fail if required endpoints are missing?

  const widget = await factory.createFromCLI(dashund)

  config.zones.get(zone)!.push({
    type: type,
    id: identifier,
    ...widget
  })

  config.save(argv.path)
})

handlers.set('zone', async (dashund, argv) => {
  let config = dashund.loadConfig(argv.path)

  let { identifier } = await prompts({
    type: 'text',
    name: 'identifier',
    message: 'Zone identifier'
  })

  if (config.zones.has(identifier)) {
    throw new Error('Zone already exists')
  }

  config.zones.set(identifier, [])
  config.save(argv.path)
})

export async function handleCommand(dashund: Dashund, argv: Arguments<Params>) {
  try {
    let { type } = argv

    if (!type) {
      const { newType } = await prompts({
        type: 'select',
        name: 'newType',
        message: 'Resource type',
        choices: [
          { title: 'Token', value: 'token' },
          { title: 'Widget', value: 'widget' },
          { title: 'Zone', value: 'zone' }
        ]
      })
      type = newType
    }

    if (!type) throw new Error(`No type provided`)

    let handler = handlers.get(type)

    if (!handler) throw new Error(`Unknown resource '${type}`)

    await handler(dashund, argv)
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}

export default function registerCommand(
  yargs: Argv<DefaultCLIArgs>,
  dashund: Dashund
) {
  yargs.command(
    'create [type]',
    'Create a new resource',
    yargs => yargs.positional('type', { type: 'string' }),
    argv => handleCommand(dashund, argv)
  )
}
