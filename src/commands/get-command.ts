import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'

type Params = DefaultCLIArgs

async function handleCommand(dashund: Dashund, argv: Arguments<Params>) {
  try {
    let config = dashund.loadConfig(argv.path)

    console.log('#Tokens', config.tokens.size || '[]')
    for (let [name, token] of config.tokens) {
      console.log(`- ${name}`)
    }

    console.log('\n#Zones', config.zones.size || '{}')

    for (let [zone, widgets] of config.zones) {
      console.log(zone, widgets.length || '[]')

      for (let widget of widgets) {
        console.log(`- ${widget.type}:${widget.id}`)
      }
      console.log()
    }
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}

export default function registerCommand(
  yargs: Argv<DefaultCLIArgs>,
  dashund: Dashund
) {
  yargs.command(
    'get',
    'Display resource(s)',
    yargs => yargs,
    argv => handleCommand(dashund, argv)
  )
}
