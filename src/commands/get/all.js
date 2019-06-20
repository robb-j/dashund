const Yargs = require('yargs')
const { catchAndLog } = require('../../utils')

/** @param cli {Yargs} */
function getAllCommand(cli, dashund) {
  cli.command(
    'all',
    'Show everything',
    yargs => yargs,
    catchAndLog(args => exec(dashund, args))
  )
}

function exec(dashund, args) {
  const { path, zone, identifier } = args

  let config = dashund.loadConfig(path)

  console.log('Tokens:')
  config.tokens.forEach((token, type) => {
    console.log(` - ${type}`)
  })

  console.log('\nZones:')
  config.zones.forEach((widgets, zone) => {
    console.log(` - ${zone} (${widgets.length})`)
  })
}

module.exports = { getAllCommand }
