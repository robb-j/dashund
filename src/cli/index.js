const { GetCommand } = require('./get-command')
const { AddCommand } = require('./add-command')

module.exports = {
  defaultCommands: [new GetCommand(), new AddCommand()]
}
