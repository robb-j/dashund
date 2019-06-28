const { executeCreateZone } = require('../zone')
const { Dashund } = require('../../../dashund')
const { Config } = require('../../../core')

describe('#executeCreateZone', () => {
  let dashund, config
  beforeEach(() => {
    dashund = new Dashund({}, {})
    config = new Config(dashund.widgetFactories, dashund.tokenFactories)
    config.save = jest.fn()

    jest.spyOn(Config, 'from').mockReturnValue(config)
  })

  it('should add a zone', async () => {
    executeCreateZone(dashund, {
      path: 'test_dir',
      identifier: 'new_zone'
    })

    expect(config.zones.get('new_zone')).toEqual([])

    expect(config.save).toHaveBeenCalledWith('test_dir')
  })

  it('should fail if the zone already exists', () => {
    let exec = () =>
      executeCreateZone(dashund, {
        path: 'test_dir',
        identifier: 'new_zone'
      })

    config.zones.set('new_zone', [])

    expect(exec).toThrow()
  })
})
