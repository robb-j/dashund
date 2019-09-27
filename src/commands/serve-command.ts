import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'
import { wrapCommand } from '../core'

type Params = DefaultCLIArgs & {
  port: number
}

async function handleCommand(dashund: Dashund, argv: Arguments<Params>) {
  await dashund.runServer(argv.port)
  console.log(`Listening on :${argv.port}`)
}

export default function registerCommand(
  yargs: Argv<DefaultCLIArgs>,
  dashund: Dashund
) {
  yargs.command(
    'serve [port]',
    'Run the dashund server',
    yargs => yargs.positional('port', { type: 'number', default: 3000 }),
    argv => wrapCommand(() => handleCommand(dashund, argv))
  )
}
