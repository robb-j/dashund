const Yargs = require('yargs')

function createTokenCommand(cli, dashund) {
  cli.command(
    'token <identifier> <type>',
    'Show a dashund token',
    yargs => yargs,
    args => {
      console.log('create_token')
    }
  )
}

async function executeCreateToken(dashund, args) {
  const { path, identifier, type } = args

  let config = dashund.loadConfig(path)

  // Fail if the token already exists
  if (config.tokens.has(identifier)) {
    throw new Error(`token '${identifier}' already exists`)
  }

  // Fail for invalid token types
  if (!dashund.tokenTypes.has(type)) {
    throw new Error(`Invalid Token type '${type}'`)
  }

  // Use the type to create a token
  let TokenType = dashund.tokenTypes.get(type)
  let token = await TokenType.createFromCLI()

  // Store the token
  config.tokens.set(identifier, {
    id: identifier,
    type: type,
    ...token
  })

  // Save the config
  config.save(path)
}

module.exports = { createTokenCommand, executeCreateToken }
