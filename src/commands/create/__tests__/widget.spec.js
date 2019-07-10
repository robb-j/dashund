const { executeCreateWidget } = require('../widget')
const { Dashund, Config } = require('../../../index')

const mockWidgets = () => ({
  MockWidget: {
    requiredEndpoints: ['test/endpoint'],
    createFromCLI: jest.fn(() => ({ configuredFromCLI: true }))
  }
})

const mockEndpoints = () => [
  {
    name: 'test/endpoint',
    interval: '10m',
    handler: () => 'Hey'
  }
]

const correctWidgetArgs = {
  path: 'test_dir',
  zone: 'zone_a',
  identifier: 'new_widget',
  type: 'MockWidget'
}

describe('#executeCreateWidget', () => {
  let dashund, config, widgetFactory
  beforeEach(() => {
    dashund = new Dashund(mockWidgets(), {}, mockEndpoints())
    widgetFactory = dashund.widgetFactories.get('MockWidget')

    config = new Config(dashund.widgetFactories, dashund.tokenFactories)
    config.save = jest.fn()
    config.zones.set('zone_a', [])

    jest.spyOn(Config, 'from').mockReturnValue(config)
  })

  it('should fail if the zone does not exist', async () => {
    let promise = executeCreateWidget(dashund, {
      path: 'test_dir',
      zone: 'zone_b',
      identifier: 'new_widget',
      type: 'MockWidget'
    })

    await expect(promise).rejects.toThrow()
  })

  it('should fail if the widget type doesn no exist', async () => {
    let promise = executeCreateWidget(dashund, {
      path: 'test_dir',
      zone: 'zone_a',
      identifier: 'new_widget',
      type: 'InvalidWidget'
    })

    await expect(promise).rejects.toThrow()
  })

  it('should fail for missing endpoints', async () => {
    widgetFactory.requiredEndpoints = ['test/anotherEndpoint']

    let promise = executeCreateWidget(dashund, correctWidgetArgs)

    await expect(promise).rejects.toThrow()
  })

  it('should configure the widget from the CLI', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(widgetFactory.createFromCLI).toHaveBeenCalled()
  })

  it('should store the widget', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(config.zones.get('zone_a')).toHaveLength(1)
    expect(config.zones.get('zone_a')).toContainEqual({
      id: 'new_widget',
      type: 'MockWidget',
      configuredFromCLI: true
    })
  })

  it('should save the config', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(config.save).toHaveBeenCalledWith('test_dir')
  })
})
