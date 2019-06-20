const Yargs = require('yargs')

function createWidgetCommand(cli, dashund) {
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
