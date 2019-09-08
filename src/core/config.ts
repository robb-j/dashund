import { join } from 'path'
import * as fs from 'fs'
import * as Yaml from 'yaml'

import { sharedLogger } from '../utils'

import { Token, TokenFactory } from './token'
import { Widget, WidgetFactory } from './widget'

export const CONFIG_FOLDER = '.dashund'

export class Config {
  zones: Map<string, Widget[]>
  tokens: Map<string, Token>
  widgetFactories: Map<string, WidgetFactory>
  tokenFactories: Map<string, TokenFactory>
  isDirty: boolean

  constructor(widgetFactories = new Map(), tokenFactories = new Map()) {
    this.zones = new Map()
    this.tokens = new Map()
    this.widgetFactories = widgetFactories
    this.tokenFactories = tokenFactories
    this.isDirty = false
  }

  static from(
    path = '.',
    widgetFactories = new Map<string, WidgetFactory>(),
    tokenFactories = new Map<string, TokenFactory>()
  ) {
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

  parseZones(data: any) {
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

  parseToken(data: object) {
    for (let [type, config] of Object.entries(data)) {
      this.tokens.set(type, { type, ...config })
    }
  }

  save(dir: string) {
    let path = join(dir, CONFIG_FOLDER)

    // First ensure the dashund folder exists
    try {
      fs.statSync(path)
    } catch (error) {
      // Make the folder
      fs.mkdirSync(path, { recursive: true })
    }

    let widgetsData: any = {}
    this.zones.forEach((widgets, zoneName) => {
      widgetsData[zoneName] = widgets
    })

    let tokensData: any = {}
    this.tokens.forEach((token, tokenName) => {
      tokensData[tokenName] = token
    })

    // Save widgets.yml
    fs.writeFileSync(join(path, 'widgets.yml'), Yaml.stringify(widgetsData))

    // Save tokens.json
    fs.writeFileSync(join(path, 'tokens.json'), JSON.stringify(tokensData))
  }
}
