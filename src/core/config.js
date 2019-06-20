const { join } = require('path')
const fs = require('fs')
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
      console.log(error)
      throw new Error(`Failed to load config`)
    }
    return config
  }

  parseZones(data) {
    for (let [zone, widgets] of Object.entries(data)) {
      if (!Array.isArray(widgets)) throw new Error(`${zone} is not an array`)

      let parsedWidgets = widgets.map(widget => {
        const type = this.widgetTypes.get(widget.type)
        if (!type) throw new Error(`Invalid widget ${widget.type}`)
        return type.create(widget)
      })

      this.zones.set(zone, parsedWidgets)
    }
  }

  parseToken(data) {
    for (let [type, config] of Object.entries(data)) {
      this.tokens.set(type, { type, ...config })
    }
  }

  save(dir) {
    let path = join(dir, '.dashund')

    // First ensure the dashund folder exists
    try {
      fs.statSync(path)
    } catch (error) {
      // Make the folder
      fs.mkdirSync(path, { recursive: true })
    }

    let widgetsData = {}
    this.zones.forEach((widgets, zoneName) => {
      console.log(widgets)
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

module.exports = { Config }
