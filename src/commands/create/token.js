const Yargs = require('yargs')

function createTokenCommand(cli, config, dashund, cwd) {
  cli.command(
    'token',
    'Show a dashund token',
    yargs => yargs,
    args => {
      console.log('create_token')
    }
  )
}

module.exports = { createTokenCommand }
