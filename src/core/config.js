const { join } = require('path')
const { readdirSync, readFileSync } = require('fs')
const Yaml = require('yaml')

class Config {
  constructor(widgetTypes = new Map(), tokenTypes = new Map()) {
    this.zones = new Map()
    this.tokens = new Map()
    this.widgetTypes = widgetTypes
    this.tokenTypes = tokenTypes
  }

  static from(path = '.', widgetTypes, tokenTypes) {
    const configDir = join(path, '.dashund')
    const config = new Config(widgetTypes, tokenTypes)

    let paths
    try {
      paths = readdirSync(configDir)
    } catch (error) {
      return config
    }

    try {
      if (paths.includes('widgets.yml')) {
        const widgetData = readFileSync(join(configDir, 'widgets.yml'), 'utf8')
        config.parseZones(Yaml.parse(widgetData))
      }

      if (paths.includes('authorizations.json')) {
        const authData = readFileSync(
          join(configDir, 'authorizations.json'),
          'utf8'
        )
        config.parseToken(JSON.parse(authData))
      }
    } catch (error) {
      console.log(error)
      throw new Error(`Failed to load config`)
    }
    return config
  }

  parseZones(data) {
    for (let [zone, widgets] of Object.entries(data)) {
      if (!Array.isArray(widgets)) throw new Error(`${zone} is not an array`)

      this.zones.set(zone, {
        title: zone,
        widgets: widgets.map(config => {
          const type = this.widgetTypes.get(config.type)
          if (!type) throw new Error(`Invalid widget ${config.type}`)
          return type.create(config)
        })
      })
    }
  }

  parseToken(data) {
    for (let [type, config] of Object.entries(data)) {
      this.tokens.set(type, { type, ...config })
    }
  }
}

module.exports = { Config }
