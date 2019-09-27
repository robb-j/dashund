import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'

export interface CommandFactory {
  (yargs: Argv<DefaultCLIArgs>, dashund: Dashund): void
}

export async function wrapCommand(fn: () => Promise<void> | void) {
  try {
    await fn()
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}
