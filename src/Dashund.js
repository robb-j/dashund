const yargs = require('yargs/yargs')

const { Config } = require('./core/config')

const { defaultCommands } = require('./commands')

class Dashund {
  constructor(widgets = {}, tokens = {}) {
    this.widgetTypes = new Map(Object.entries(widgets))
    this.tokenTypes = new Map(Object.entries(tokens))
    this.commands = defaultCommands
  }

  async runCLI(args = process.argv.slice(2), cwd = process.cwd()) {
    let cli = yargs(args)
      .help()
      .alias('help', 'h')
      .option('path', {
        describe: 'The path to your .dashund folder',
        default: process.cwd()
      })

    // let config = Config.from(cwd, this.widgetTypes, this.authz)

    for (let command of this.commands) command(cli, this)

    let argv = cli.parse()

    if (argv._[0] === undefined) {
      console.log('Unknown command')
      process.exit(1)
    }
  }

  loadConfig(path) {
    return Config.from(path, this.widgetTypes, this.tokenTypes)
  }
}

module.exports = { Dashund }
