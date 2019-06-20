const yargs = require('yargs/yargs')

const { Config } = require('./core/config')

const { defaultCommands } = require('./commands')

class Dashund {
  constructor(widgets = {}, authorizations = {}) {
    this.widgets = new Map(Object.entries(widgets))
    this.authz = new Map(Object.entries(authorizations))
    this.commands = defaultCommands
  }

  async runCLI(args = process.argv.slice(2), cwd = process.cwd()) {
    let cli = yargs(args)
      .help()
      .alias('help', 'h')

    let config = Config.from(cwd, this.widgets, this.authz)

    for (let command of this.commands) command(cli, config, this, cwd)

    let argv = cli.parse()

    if (argv._[0] === undefined) {
      console.log('Unknown command')
      process.exit(1)
    }
  }
}

module.exports = { Dashund }
