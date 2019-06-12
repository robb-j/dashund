const Yargs = require('yargs')
const { Config } = require('../core/config')

const { Command } = require('./command')

class GetCommand extends Command {
  /** @param cli {Yargs} */
  setup(cli, config, dashund, cwd) {
    cli.command(
      'get',
      // 'get <type> [id]',
      'Get a Dashund resource from the local .dashund folder',
      yargs => yargs,
      // .positional('type', {
      //   describe: 'The type of resource',
      //   choices: ['all', 'zone', 'authz']
      // })
      // .positional('id', {
      //   describe: 'The id of a specific resource to get'
      // }),
      this.catchAndLog(args => this.exec(config, args.type, args.id))
    )
  }

  /** @param cli {Config} */
  exec(config, type, id) {
    console.log(config)
  }
}

module.exports = { GetCommand }
