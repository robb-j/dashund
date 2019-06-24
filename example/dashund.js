const { Dashund } = require('../src')
const prompts = require('prompts')

const TestToken = {
  create: config => config,
  async createFromCLI() {
    return { token: 'some_top_secret_value' }
  },
  validate: config => typeof config.token === 'string'
}

const TestWidget = {
  requiredTokens: ['TestToken'],
  create(config) {
    return config
  },
  async createFromCLI() {
    const { title } = await prompts({
      type: 'text',
      name: 'title',
      message: 'Widget title'
    })

    if (!title) throw new Error('Cancelled')

    return { title }
  },
  validate: config => typeof config.title === 'string'
}

let dashund = new Dashund({ TestWidget }, { TestToken }, [
  {
    name: 'test/endpoint',
    interval: '10s',
    handler: async ctx => {
      console.log('test/endpoint')
      return { msg: 'Hello, World!' }
    }
  }
])

module.exports = { dashund }
