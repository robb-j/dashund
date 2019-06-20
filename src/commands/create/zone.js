const Yargs = require('yargs')
const { Dashund } = require('../../dashund')
const { catchAndLog } = require('../../utils')
// const { Config } = require('../../core')

/** @param {Yargs} cli */
function createZoneCommand(cli, dashund) {
  cli.command(
    'zone <identifier>',
    'Show a dashund zone',
    yargs => yargs,
    catchAndLog(args => executeCreateZone(dashund, args))
  )
}

/** @param {Dashund} dashund */
function executeCreateZone(dashund, args) {
  const { path, identifier } = args

  let config = dashund.loadConfig(path)

  if (config.zones.has(identifier)) {
    throw new Error(`Zone '${identifier}' already exists`)
  }

  config.zones.set(identifier, [])
  config.save(path)
}

module.exports = { createZoneCommand, executeCreateZone }
