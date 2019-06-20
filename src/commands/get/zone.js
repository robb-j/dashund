const Yargs = require('yargs')
const { catchAndLog } = require('../../utils')

/** @param cli {Yargs} */
function getZoneCommand(cli, dashund) {
  cli.command(
    'zone <identifier>',
    'Show a zone',
    yargs => yargs,
    catchAndLog(args => exec(dashund, args))
  )
}

function exec(dashund, args) {
  const { path, identifier } = args

  let config = dashund.loadConfig(path)

  let widgets = config.zones.get(identifier)

  if (!widgets) {
    throw new Error(`Zone '${identifier}' not found`)
  }

  console.log('Widgets:')
  for (let widget of widgets) {
    console.log(` - ${widget.id}: ${widget.type}`)
  }
}

module.exports = { getZoneCommand }
