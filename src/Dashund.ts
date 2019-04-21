import program from 'commander'
import prompts from 'prompts'

export interface ConfigurableComponent<T> {
  config: T

  configureFromCli(): Promise<void>
  validateConfiguration(config: T): Promise<void>
}

export class Widget<Config = any> implements ConfigurableComponent<Config> {
  config!: Config
  constructor(public id: string) {}

  async configureFromCli() {}
  async validateConfiguration(config: Config) {}
}

export class Authorization<Config = any>
  implements ConfigurableComponent<Config> {
  config!: Config
  constructor(public id: string) {}

  async configureFromCli() {}
  async validateConfiguration(config: Config) {}
}

export interface WidgetClass {
  new (a: string): Widget
}

export interface AuthorizationClass {
  new (a: string): Widget
}

type ObjectMap<T> = { [idx: string]: T }

export class Dashund {
  public widgets: Map<string, WidgetClass>
  public authorizations: Map<string, AuthorizationClass>

  constructor(
    widgets: ObjectMap<WidgetClass>,
    authorizations: ObjectMap<AuthorizationClass>
  ) {
    this.widgets = new Map(Object.entries(widgets))
    this.authorizations = new Map(Object.entries(authorizations))
  }

  runCLI(argv = process.argv, cwd = process.cwd()) {
    program.command('get <type> [id]').action((type, id, options) => {
      console.log({ type, id, options })
    })

    program.parse(argv)
  }
}
