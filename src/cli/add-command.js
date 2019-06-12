const Yargs = require('yargs')
const { Config } = require('../core/config')

const { Command } = require('./command')

class AddCommand extends Command {
  /** @param cli {Yargs} */
  setup(cli, config, dashund, cwd) {
    cli.command(
      'get',
      // 'get <type> [id]',
      'Get a Dashund resource from the local .dashund folder',
      yargs => yargs,
      // .positional('type', {
      //   describe: 'The type of resource',
      //   choices: ['zone', 'widget', 'authz']
      // })
      this.catchAndLog(args => this.exec(config, args.type))
    )
  }

  /** @param cli {Config} */
  exec(config, type) {
    console.log(config)
  }
}

module.exports = { AddCommand }
