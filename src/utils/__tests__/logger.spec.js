const { Logger, sharedLogger, defaultLogLevels } = require('../logger')

describe('Logger', () => {
  describe('#constructor', () => {
    it('should fail for invalid levels', () => {
      let setup = () => new Logger('invalid_level')
      expect(setup).toThrow(/invalid_level/)
    })

    it('should setup properties', () => {
      let levels = {
        custom: 1
      }

      let logger = new Logger('custom', levels)

      expect(logger.level).toEqual('custom')
      expect(logger.availableLevels).toEqual(levels)
    })

    it('should add logger methods', () => {
      let logger = new Logger('error')

      expect(logger.silly).toBeInstanceOf(Function)
      expect(logger.debug).toBeInstanceOf(Function)
      expect(logger.verbose).toBeInstanceOf(Function)
      expect(logger.info).toBeInstanceOf(Function)
      expect(logger.warn).toBeInstanceOf(Function)
      expect(logger.error).toBeInstanceOf(Function)
    })
  })
})

describe('#sharedLogger', () => {
  it('should setup a default instance', () => {
    expect(sharedLogger.level).toEqual('error')
    expect(sharedLogger.availableLevels).toEqual(defaultLogLevels)
  })
})
