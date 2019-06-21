const express = require('express')
const stoppable = require('stoppable')
const { createServer } = require('http')
const { promisify } = require('util')

async function runTemporaryServer(port, setup) {
  let app = express()
  let server = stoppable(createServer(app))

  return new Promise(async (resolve, reject) => {
    await startServer(app, port)

    const close = promisify(server.close).bind(server)

    await setup(app, close)
  })
}

function startServer(app, port) {
  return new Promise((resolve, reject) => {
    app.listen(port, resolve)
  })
}

module.exports = { runTemporaryServer }
