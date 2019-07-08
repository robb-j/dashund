const Yargs = require('yargs')
const { Dashund } = require('../../dashund')
const { catchAndLog } = require('../../utils')

/** @param {Yargs} cli */
function createTokenCommand(cli, dashund) {
  cli.command(
    'token <type>',
    'Show a dashund token',
    yargs =>
      yargs.option('override', {
        type: 'boolean',
        describe: 'Override existing tokens'
      }),
    catchAndLog(args => executeCreateToken(dashund, args))
  )
}

/** @param {Dashund} dashund */
async function executeCreateToken(dashund, args) {
  const { path, type } = args

  let config = dashund.loadConfig(path)

  // Fail if the token already exists
  if (config.tokens.has(type) && !args.override) {
    throw new Error(`token '${type}' already exists (try --override)`)
  }

  // Fail for invalid token types
  if (!dashund.tokenFactories.has(type)) {
    throw new Error(`Invalid Token type '${type}'`)
  }

  // Use the type to create a token
  let factory = dashund.tokenFactories.get(type)
  let token = await factory.createFromCLI()

  // Store the token
  config.tokens.set(type, {
    type: type,
    ...token
  })

  // Save the config
  config.save(path)
}

module.exports = { createTokenCommand, executeCreateToken }
