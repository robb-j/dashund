const { getCommand } = require('./get')
const { createCommand } = require('./create')

module.exports = {
  defaultCommands: [getCommand, createCommand]
}
