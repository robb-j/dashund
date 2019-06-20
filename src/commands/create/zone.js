const Yargs = require('yargs')

function createZoneCommand(cli, config, dashund, cwd) {
  cli.command(
    'zone',
    'Show a dashund zone',
    yargs => yargs,
    args => {
      console.log('create_zone')
    }
  )
}

module.exports = { createZoneCommand }
