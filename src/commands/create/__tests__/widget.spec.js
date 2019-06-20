const { executeCreateWidget } = require('../widget')
const { Dashund } = require('../../../dashund')
const { Config } = require('../../../core')

const makeMockWidget = () => ({
  create: jest.fn(initial => initial),
  createFromCLI: jest.fn(() => ({})),
  validate: jest.fn(() => true)
})

const correctWidgetArgs = {
  path: 'test_dir',
  zone: 'zone_a',
  identifier: 'new_widget',
  type: 'MockWidget'
}

describe('#executeCreateWidget', () => {
  let dashund, config, MockWidget
  beforeEach(() => {
    MockWidget = makeMockWidget()
    dashund = new Dashund({ MockWidget }, {})

    config = new Config(dashund.widgetTypes, dashund.tokenTypes)
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

  it('fail if the widget doesn no exist', async () => {
    let promise = executeCreateWidget(dashund, {
      path: 'test_dir',
      zone: 'zone_a',
      identifier: 'new_widget',
      type: 'InvalidWidget'
    })

    await expect(promise).rejects.toThrow()
  })

  it('should configure the widget from the CLI', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(MockWidget.createFromCLI).toHaveBeenCalled()
  })

  it('should store the widget', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(config.zones.get('zone_a')).toHaveLength(1)
  })

  it('should store the identifier and type of the widget', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    let widget = config.zones.get('zone_a')[0]

    expect(widget.id).toEqual('new_widget')
    expect(widget.type).toEqual('MockWidget')
  })

  it('should save the config', async () => {
    await executeCreateWidget(dashund, correctWidgetArgs)

    expect(config.save).toHaveBeenCalledWith('test_dir')
  })
})
