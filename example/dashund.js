const { Dashund } = require('../dist')
const prompts = require('prompts')

const TestToken = {
  async createFromCLI() {
    return { token: 'some_top_secret_value' }
  },
  hasExpired(token) {
    return false
  },
  refreshToken(token) {
    return null
  }
}

const TestWidget = {
  requiredEndpoints: ['test/endpoint'],
  requiredTokens: ['TestToken'],

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
  {
    name: 'test/endpoint',
    requiredTokens: ['TestToken'],
    interval: '10s',
    handler: async ctx => {
      // console.log('test/endpoint')
      return { msg: 'Hello, World!' }
    }
  }
])

module.exports = { dashund }
