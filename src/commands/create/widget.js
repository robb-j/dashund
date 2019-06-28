const Yargs = require('yargs')
const { Dashund } = require('../../dashund')
const { catchAndLog } = require('../../utils')

/** @param {Yargs} cli */
function createWidgetCommand(cli, dashund) {
  cli.command(
    'widget <zone> <identifier> <type>',
    'Show a dashund widget',
    yargs => yargs,
    catchAndLog(args => executeCreateWidget(dashund, args))
  )
}

/** @param {Dashund} dashund */
async function executeCreateWidget(dashund, args) {
  const { path, zone, identifier, type } = args

  let config = dashund.loadConfig(path)

  // Fail for invalid widget types
  if (!config.zones.has(zone)) {
    throw new Error(`Zone '${zone}' doesn't exist`)
  }

  // Fail for invalid widget types
  let factory = dashund.widgetFactories.get(type)
  if (!factory) {
    throw new Error(`Invalid Widget type '${type}'`)
  }

  // Fail if required tokens are missing
  if (Array.isArray(factory.requiredEndpoints)) {
    let missing = factory.requiredEndpoints.filter(
      tokenName => !dashund.endpoints.find(e => e.name === tokenName)
    )

    if (missing.length > 0) {
      throw new Error(`${type} requires endpoints: ${missing.join(', ')}`)
    }
  }

  // Let the widget create itself from the CLI
  let widget = await factory.createFromCLI()

  // Store the widget
  config.zones.get(zone).push({
    type: type,
    id: identifier,
    ...widget
  })

  // Save the config
  config.save(path)
}

module.exports = { createWidgetCommand, executeCreateWidget }
