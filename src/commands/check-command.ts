import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'
import { Token, TokenFactory, performTokenRefresh } from '../core'
import prompts = require('prompts')

type Params = DefaultCLIArgs & {
  interactive: boolean
}

async function handleCommand(dashund: Dashund, argv: Arguments<Params>) {
  try {
    let config = dashund.loadConfig(argv.path)

    //
    // First find which tokens have expired and let the user know
    //
    let hasExpired = new Array<[Token, TokenFactory]>()

    console.log('\nChecking tokens')

    for (let [type, token] of config.tokens) {
      let factory = config.tokenFactories.get(token.type)

      if (!factory) {
        console.log(`⨉ ${type} – no matching TokenFactory`)
        continue
      }

      if (factory.hasExpired(token)) {
        console.log(`⨉ ${type} – has expired`)

        if (argv.interactive) {
          hasExpired.push([token, factory])
        }
      } else {
        console.log(`✓ ${type}`)
      }
    }

    if (hasExpired.length === 0) return

    const { confirmRefresh } = await prompts({
      name: 'confirmRefresh',
      type: 'confirm',
      message: `Refresh tokens: ${hasExpired.map(t => t[0].type).join(', ')}`
    })

    if (!confirmRefresh) return

    const stillExpired = new Array<[Token, TokenFactory]>()

    console.log('\nRefreshing tokens')

    for (let [token, factory] of hasExpired) {
      let passed = true
      try {
        await performTokenRefresh(token, factory, config, true)
      } catch (error) {
        passed = false
      }

      if (passed) {
        console.log(`✓ ${token.type}`)
      } else {
        console.log(`⨉ ${token.type}`)
        stillExpired.push([token, factory])
      }
    }

    if (stillExpired.length === 0) return

    console.log('\nSome tokens are still expired')

    for (let [token, factory] of stillExpired) {
      const { confirmRecreate } = await prompts({
        name: 'confirmRecreate',
        type: 'confirm',
        message: `Recreate ${token.type}?`
      })

      if (!confirmRecreate) continue

      config.tokens.set(token.type, {
        type: token.type,
        ...(await factory.createFromCLI(dashund))
      })

      config.save(argv.path)
    }
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
    'check',
    'Check token authentication',
    yargs =>
      yargs.option('interactive', {
        alias: 'u',
        type: 'boolean',
        describe: 'Attempt interactive updates',
        default: false
      }),
    args => handleCommand(dashund, args)
  )
}
