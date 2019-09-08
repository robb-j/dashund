import { Logger, sharedLogger, allLogLevels } from '../logger'

describe('Logger', () => {
  describe('#constructor', () => {
    it('should setup properties', () => {
      let logger = new Logger('silly')

      expect(logger.level).toEqual('silly')
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
  })
})
