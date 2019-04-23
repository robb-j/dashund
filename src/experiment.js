const { Dashund } = require('./Dashund')
const prompts = require('prompts')

const TestWidget = {
  create(config) {
    return config
  },
  async configureFromCli() {
    const { title } = await prompts({
      type: 'text',
      name: 'title',
      message: 'Widget title'
    })

    if (!title) throw new Error('Cancelled')

    return { title }
  },
  validateConfig(config) {}
}

let dash = new Dashund(
  {
    test: TestWidget
  },
  {}
)

dash.runCLI()
