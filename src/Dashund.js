const program = require('commander')
const prompts = require('prompts')
const { join } = require('path')
const {
  readdirSync,
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync
} = require('fs')
const YAML = require('yaml')

const catchAndLog = block => async (...args) => {
  try {
    await block(...args)
  } catch (error) {
    console.log(error.message)
    console.log(error.stack.split('\n')[1])
  }
}

const stringToChoice = string => ({ title: string, value: string })

// interface Configurable {
//   create(config: any): Widget
//   configureFromCli(): Widget
//   validateConfig(config: any)
// }

class Dashund {
  get hasWidgets() {
    return Array.from(this.widgets.keys()).length > 0
  }

  get hasAuthzs() {
    return Array.from(this.authz.keys()).length > 0
  }

  constructor(widgets, authorizations) {
    this.widgets = new Map(Object.entries(widgets))
    this.authz = new Map(Object.entries(authorizations))
  }

  async loadConfig(path) {
    const configDir = join(path, '.dashund')
    const config = { zones: {}, authz: {} }

    try {
      const paths = readdirSync(configDir)

      if (paths.includes('widgets.yml')) {
        const widgetData = readFileSync(join(configDir, 'widgets.yml'), 'utf8')
        config.zones = this.parseZones(YAML.parse(widgetData))
      }

      if (paths.includes('authorizations.json')) {
        const authData = readFileSync(
          join(configDir, 'authorizations.json'),
          'utf8'
        )
        config.authz = this.parseAuthz(JSON.parse(authData))
      }
    } catch (error) {
      console.log(error.message)
      console.log(error.stack.split('\n')[1])
    }
    return config
  }

  async saveConfig(path, config) {
    const configDir = join(path, '.dashund')

    try {
      let stat = statSync(configDir)
      if (!stat.isDirectory())
        throw new Error(`${configDir} is not a directory`)
    } catch (error) {
      mkdirSync(configDir)
    }

    writeFileSync(join(configDir, 'widgets.yml'), YAML.stringify(config.zones))
    writeFileSync(
      join(configDir, 'authorizations.json'),
      JSON.stringify(config.authz)
    )
  }

  parseZones(data) {
    let output = {}

    Object.keys(data).forEach(zone => {
      output[zone] = {
        name: zone,
        widgets: data[zone].map(config =>
          this.widgets.get(config.type).create(config)
        )
      }
    })

    return output
  }

  parseAuthz(data) {
    const output = {}
    Object.keys(data).forEach(
      name =>
        (output[name] = this.authz.get(data[name].type).create(data[name]))
    )
    return output
  }

  async runCLI(argv = process.argv, cwd = process.cwd()) {
    program
      .command('get <type> [id]')
      .action(catchAndLog((type, id) => this.get(cwd, type, id)))

    program
      .command('create <type>')
      .action(catchAndLog((type, id) => this.create(cwd, type)))

    program
      .command('delete <type> <id>')
      .action(catchAndLog((type, id) => this.delete(cwd, type, id)))

    program.parse(argv)
  }

  async get(cwd, type, id = undefined) {
    let config = await this.loadConfig(cwd)
    console.log(config)
  }

  async create(cwd, type) {
    let config = await this.loadConfig(cwd)

    switch (type) {
      case 'zone':
        await this.createZone(config)
        break
      case 'widget':
        await this.createWidget(config)
        break
      default:
        throw new Error(`Unknown type '${type}'`)
    }

    await this.saveConfig(cwd, config)
  }

  async createZone(config) {
    let { name } = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'Zone name:'
      }
    ])

    if (!name) throw new Error('Cancelled')

    if (config.zones[name]) {
      throw new Error(`Zone '${name}' already exists`)
    }

    config.zones[name] = []
  }

  async createWidget(config) {
    if (!this.hasWidgets) throw new Error('No widgets available')

    let zone = Object.keys(config.zones)[0]

    if (!zone) {
      await this.createZone(config)
      zone = Object.keys(config.zones)[0]
    } else {
      ;({ zone } = await prompts({
        type: 'select',
        name: 'zone',
        message: 'Pick a zone',
        choices: Object.keys(config.zones).map(stringToChoice)
      }))
    }

    if (!zone) throw new Error('Cancelled')

    let { name, type } = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'Widget name'
      },
      {
        type: 'select',
        name: 'type',
        message: 'Pick a type',
        choices: Array.from(this.widgets.keys()).map(stringToChoice)
      }
    ])

    if (!name || !type) throw new Error('Cancelled')

    let widgetConfig = await this.widgets.get(type).configureFromCli()

    console.log({ name, zone, type, widgetConfig })

    config.zones[zone].push({
      id: name,
      type: type,
      config: widgetConfig
    })
  }

  async delete(cwd, type, id) {
    let config = await this.loadConfig(cwd)

    let { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure?'
    })

    if (!confirm) return

    switch (type) {
      case 'zone': {
        delete config.zones[id]
        console.log(`Deleted zone '${id}'`)
        break
      }
    }

    await this.saveConfig(cwd, config)
  }
}

module.exports = { Dashund }
