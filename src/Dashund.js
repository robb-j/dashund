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

const validResources = ['widget', 'auth', 'zone', 'all']

const catchAndLog = block => async (...args) => {
  try {
    await block(...args)
  } catch (error) {
    console.log(error)
  }
}

class Dashund {
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
        widgets: data[zone].widgets.map(config =>
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
        return this.createZone(cwd, config)
      default:
        throw new Error(`Unknown type '${type}'`)
    }
  }

  async createZone(cwd, config) {
    let { name } = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'Zone name:'
      }
    ])

    if (config.zones[name]) throw new Error(`Zone '${name}' already exists`)

    config.zones[name] = { name, widgets: [] }

    await this.saveConfig(cwd, config)
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
