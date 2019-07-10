const { Dashund, TokenFactory, WidgetFactory, Endpoint } = require('../src')
const prompts = require('prompts')

class TestToken extends TokenFactory {
  async createFromCLI() {
    return { token: 'some_top_secret_value' }
  }
}

class TestWidget extends WidgetFactory {
  constructor() {
    super()
    this.requiredEndpoints = ['test/endpoint']
  }

  async createFromCLI() {
    const { title } = await prompts({
      type: 'text',
      name: 'title',
      message: 'Widget title'
    })

    if (!title) throw new Error('Cancelled')

    return { title }
  }
}

let dashund = new Dashund({ TestWidget }, { TestToken }, [
  new Endpoint({
    name: 'test/endpoint',
    requiredTokens: ['TestToken'],
    interval: '10s',
    handler: async ctx => {
      // console.log('test/endpoint')
      return { msg: 'Hello, World!' }
    }
  })
])

module.exports = { dashund }
