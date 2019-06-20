const Yargs = require('yargs')
const { catchAndLog } = require('../utils')

const { getWidgetCommand } = require('./get/widget')
const { getZoneCommand } = require('./get/zone')
const { getTokenCommand } = require('./get/token')
const { getAllCommand } = require('./get/all')

/** @param cli {Yargs} */
function getCommand(cli, dashund) {
  cli.command(
    'get',
    'Get a Dashund resource from the local .dashund folder',
    yargs => {
      getWidgetCommand(yargs, dashund)
      getZoneCommand(yargs, dashund)
      getTokenCommand(yargs, dashund)
      getAllCommand(yargs, dashund)
    }
  )
}

function exec(dashund, args) {
  let config = dashund.loadConfig(args.path)
  console.log(config)
}

module.exports = { getCommand }
