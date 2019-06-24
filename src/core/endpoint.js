class Endpoint {
  constructor(name, interval, handler) {
    this.name = name
    this.interval = interval
    this.handler = handler
  }

  exec(config) {
    return this.handler({})
  }
}

module.exports = { Endpoint }
