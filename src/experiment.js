const { Dashund } = require('./Dashund')
const prompts = require('prompts')
const express = require('express')
const { createServer } = require('http')

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

let dash = new Dashund({ TestWidget }, { TestToken }, [
  {
    name: 'test/endpoint',
    interval: '10s',
    handler: async ctx => {
      console.log('test/endpoint')
      return { msg: 'Hello, World!' }
    }
  }
])

// dash.runCLI()

;(async () => {
  await dash.runServer(3000)
  console.log('Listening on :3000')
})()
