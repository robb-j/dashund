import { Argv, Arguments } from 'yargs'
import { Dashund, DefaultCLIArgs } from '../dashund'

export interface CommandFactory {
  (yargs: Argv<DefaultCLIArgs>, dashund: Dashund): void
}
