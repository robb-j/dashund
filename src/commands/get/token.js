const Yargs = require('yargs')
const { catchAndLog } = require('../../utils')

/** @param cli {Yargs} */
function getTokenCommand(cli, dashund) {
  cli.command(
    'token <type>',
    'Show a token',
    yargs => yargs,
    catchAndLog(args => exec(dashund, args))
  )
}

function exec(dashund, args) {
  const { path, type } = args

  let config = dashund.loadConfig(path)

  let token = config.tokens.get(type)

  if (!token) {
    throw new Error(`Token '${type}' not found`)
  }

  console.log(token)
}

module.exports = { getTokenCommand }
