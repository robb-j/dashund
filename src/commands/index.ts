import get from './get-command'
import create from './create-command'
import check from './check-command'
import { CommandFactory } from '../core'

export const defaultCommands: CommandFactory[] = [get, create, check]
