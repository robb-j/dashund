const Yargs = require('yargs')
const { catchAndLog } = require('../utils')

/** @param cli {Yargs} */
function getCommand(cli, config, dashund, cwd) {
  cli.command(
    'get',
    'Get a Dashund resource from the local .dashund folder',
    yargs => yargs,
    catchAndLog(args => exec(config, args))
  )
}

function exec(config, args) {
  console.log(config, args)
}

module.exports = { getCommand }
