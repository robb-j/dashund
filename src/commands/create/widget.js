const Yargs = require('yargs')

function createWidgetCommand(cli, config, dashund, cwd) {
  cli.command(
    'widget',
    'Show a dashund widget',
    yargs => yargs,
    args => {
      console.log('create_widget')
    }
  )
}

module.exports = { createWidgetCommand }
