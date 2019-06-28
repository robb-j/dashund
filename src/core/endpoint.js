const ms = require('ms')

/** A function responsible for periodically fetching information */
class Endpoint {
  constructor({ name, interval, handler, requiredTokens = [] }) {
    if (typeof name !== 'string') throw new Error('invalid name')
    if (typeof interval !== 'string') throw new Error('invalid interval')
    if (typeof handler !== 'function') throw new Error('invalid handler')

    if (ms(interval) === undefined) throw new Error('invalid interval')

    if (!requiredTokens.every(name => typeof name === 'string')) {
      throw new Error('invalid requiredTokens')
    }

    this.name = name
    this.interval = interval
    this.handler = handler
    this.requiredTokens = requiredTokens
  }
}

module.exports = { Endpoint }
