const { join } = require('path')
const fs = require('fs')
const Yaml = require('yaml')

const { sharedLogger } = require('../utils')

const CONFIG_FOLDER = '.dashund'

class Config {
  constructor(widgetFactories = new Map(), tokenFactories = new Map()) {
    this.zones = new Map()
    this.tokens = new Map()
    this.widgetFactories = widgetFactories
    this.tokenFactories = tokenFactories
    this.isDirty = false
  }

  static from(path = '.', widgetFactories, tokenFactories) {
    const configDir = join(path, CONFIG_FOLDER)
    const config = new Config(widgetFactories, tokenFactories)

    let paths
    try {
      paths = fs.readdirSync(configDir)
    } catch (error) {
      return config
    }

    try {
      if (paths.includes('widgets.yml')) {
        const widgetData = fs.readFileSync(
          join(configDir, 'widgets.yml'),
          'utf8'
        )
        config.parseZones(Yaml.parse(widgetData))
      }

      if (paths.includes('tokens.json')) {
        const authData = fs.readFileSync(join(configDir, 'tokens.json'), 'utf8')
        config.parseToken(JSON.parse(authData))
      }
    } catch (error) {
      sharedLogger.error(error)
      throw new Error(`Failed to load config`)
    }
    return config
  }

  parseZones(data) {
    for (let [zone, widgets] of Object.entries(data)) {
      if (!Array.isArray(widgets)) throw new Error(`${zone} is not an array`)

      for (let i in widgets) {
        if (typeof widgets[i] !== 'object') {
          throw new Error(`${zone}.widgets[${i}] is not an object`)
        }
      }

      this.zones.set(zone, widgets)
    }
  }

  parseToken(data) {
    for (let [type, config] of Object.entries(data)) {
      this.tokens.set(type, { type, ...config })
    }
  }

  save(dir) {
    let path = join(dir, CONFIG_FOLDER)

    // First ensure the dashund folder exists
    try {
      fs.statSync(path)
    } catch (error) {
      // Make the folder
      fs.mkdirSync(path, { recursive: true })
    }

    let widgetsData = {}
    this.zones.forEach((widgets, zoneName) => {
      widgetsData[zoneName] = widgets
    })

    let tokensData = {}
    this.tokens.forEach((token, tokenName) => {
      tokensData[tokenName] = token
    })

    // Save widgets.yml
    fs.writeFileSync(join(path, 'widgets.yml'), Yaml.stringify(widgetsData))

    // Save tokens.json
    fs.writeFileSync(join(path, 'tokens.json'), JSON.stringify(tokensData))
  }
}

module.exports = { Config, CONFIG_FOLDER }
