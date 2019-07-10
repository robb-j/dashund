const { requiredArg } = require('../utils')

class WidgetFactory {
  constructor({
    createFromCLI = requiredArg('createFromCLI'),
    requiredEndpoints = [],
    requiredTokens = []
  } = {}) {
    this.createFromCLI = createFromCLI
    this.requiredEndpoints = requiredEndpoints
    this.requiredTokens = requiredTokens
  }
}

module.exports = { WidgetFactory }
