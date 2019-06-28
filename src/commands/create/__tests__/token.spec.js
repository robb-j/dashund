const { executeCreateToken } = require('../token')
const { Dashund } = require('../../../dashund')
const { Config } = require('../../../core')

const makeMockTokenFactory = () => ({
  create: jest.fn(initial => initial),
  createFromCLI: jest.fn(() => ({ configuredFromCLI: true })),
  validate: jest.fn(() => true)
})

const correctTokenArgs = {
  path: 'test_dir',
  type: 'MockToken'
}

describe('#executeCreateToken', () => {
  let dashund, config, MockToken
  beforeEach(() => {
    MockToken = makeMockTokenFactory()
    dashund = new Dashund({}, { MockToken })

    config = new Config(dashund.widgetFactories, dashund.tokenFactories)
    config.save = jest.fn()
    config.zones.set('zone_a', [])

    jest.spyOn(Config, 'from').mockReturnValue(config)
  })

  it('should fail if the token type does not exist', async () => {
    let promise = executeCreateToken(dashund, {
      path: 'test_dir',
      type: 'InvalidToken'
    })

    await expect(promise).rejects.toThrow()
  })

  it('should fail if the token already exists', async () => {
    config.tokens.set('MockToken', { some: 'value' })

    let promise = executeCreateToken(dashund, correctTokenArgs)

    await expect(promise).rejects.toThrow()
  })

  it('should configure the token from the CLI', async () => {
    await executeCreateToken(dashund, correctTokenArgs)

    expect(MockToken.createFromCLI).toHaveBeenCalled()
  })

  it('should store the token under its type', async () => {
    await executeCreateToken(dashund, correctTokenArgs)

    expect(config.tokens.get('MockToken')).toEqual({
      type: 'MockToken',
      configuredFromCLI: true
    })
  })

  it('should save the config', async () => {
    await executeCreateToken(dashund, correctTokenArgs)

    expect(config.save).toHaveBeenCalledWith('test_dir')
  })
})
