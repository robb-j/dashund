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
  if (!dashund.widgetTypes.has(type)) {
    throw new Error(`Invalid Widget type '${type}'`)
  }

  // Create the widget using it's type
  let WidgetType = dashund.widgetTypes.get(type)
  let widget = await WidgetType.createFromCLI()

  // Fail if required tokens are missing
  if (Array.isArray(WidgetType.requiredTokens)) {
    let missing = WidgetType.requiredTokens.filter(
      tokenName => !config.tokens.has(tokenName)
    )

    if (missing.length > 0) {
      throw new Error(`${type} requires tokens: ${missing.join(', ')}`)
    }
  }

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
