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

  it('should add convenience methods', () => {
    let logger = new Logger('silly')
    logger.write = jest.fn()

    logger.silly('silly_message')
    logger.debug('debug_message')
    logger.verbose('verbose_message')
    logger.info('info_message')
    logger.warn('warn_message')
    logger.error('error_message')

    expect(logger.write).toBeCalledWith('silly', 'silly_message')
    expect(logger.write).toBeCalledWith('debug', 'debug_message')
    expect(logger.write).toBeCalledWith('verbose', 'verbose_message')
    expect(logger.write).toBeCalledWith('info', 'info_message')
    expect(logger.write).toBeCalledWith('info', 'info_message')
    expect(logger.write).toBeCalledWith('warn', 'warn_message')
    expect(logger.write).toBeCalledWith('error', 'error_message')
  })
})

describe('#sharedLogger', () => {
  it('should setup a default instance', () => {
    expect(sharedLogger.level).toEqual('error')
  })
})
