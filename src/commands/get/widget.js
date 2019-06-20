const Yargs = require('yargs')
const { catchAndLog } = require('../../utils')

/** @param cli {Yargs} */
function getWidgetCommand(cli, dashund) {
  cli.command(
    'widget <zone> <identifier>',
    'Show a widget',
    yargs => yargs,
    catchAndLog(args => exec(dashund, args))
  )
}

function exec(dashund, args) {
  const { path, zone, identifier } = args

  let config = dashund.loadConfig(path)

  if (!config.zones.has(zone)) {
    throw new Error(`Zone '${zone}' not found`)
  }

  let widget = config.zones.get(zone).find(w => w.id === identifier)

  if (!widget) {
    throw new Error(`Widget '${identifier}' not found in zone '${zone}'`)
  }

  console.log(widget)
}

module.exports = { getWidgetCommand }
