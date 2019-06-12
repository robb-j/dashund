const { Command } = require('../command')

const cmd = new Command()

describe('Command', () => {
  describe('#catchAndLog', () => {
    it('should log the error', async () => {
      let spy = jest.fn()

      let wrapped = cmd.catchAndLog(() => {
        throw new Error('a_specific_error')
      }, spy)

      await wrapped()

      expect(spy).toHaveBeenCalledWith('a_specific_error')
    })
  })
})
