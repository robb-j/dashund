const Yargs = require('yargs')
// const { Config } = require('../core/config')

const { createZoneCommand } = require('./create/zone')
const { createWidgetCommand } = require('./create/widget')
const { createTokenCommand } = require('./create/token')

/** @param cli {Yargs} */
function createCommand(cli, config, dashund, cwd) {
  cli.command(
    'create <zone|widget|token>',
    'Create a dashund resource',
    yargs => {
      createZoneCommand(yargs, config, dashund, cwd)
      createWidgetCommand(yargs, config, dashund, cwd)
      createTokenCommand(yargs, config, dashund, cwd)
    }
  )
}

module.exports = { createCommand }
