const Yargs = require('yargs')
const { catchAndLog } = require('../utils')

/** @param cli {Yargs} */
function getCommand(cli, dashund) {
  cli.command(
    'get',
    'Get a Dashund resource from the local .dashund folder',
    yargs => yargs,
    catchAndLog(args => exec(dashund, args))
  )
}

function exec(dashund, args) {
  let config = dashund.loadConfig(args.path)
  console.log(config)
}

module.exports = { getCommand }
