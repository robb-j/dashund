const Yargs = require('yargs')
// const { Config } = require('../core/config')

const { createZoneCommand } = require('./create/zone')
const { createWidgetCommand } = require('./create/widget')
const { createTokenCommand } = require('./create/token')

/** @param cli {Yargs} */
function createCommand(cli, dashund) {
  cli.command(
    'create <zone|widget|token>',
    'Create a dashund resource',
    yargs => {
      createZoneCommand(yargs, dashund)
      createWidgetCommand(yargs, dashund)
      createTokenCommand(yargs, dashund)
    }
  )
}

module.exports = { createCommand }
