import { catchAndLog } from '../catch-and-log'

describe('#catchAndLog', () => {
  it('should log the error', async () => {
    let spy = jest.fn()

    let wrapped = catchAndLog(() => {
      throw new Error('a_specific_error')
    }, spy)

    await wrapped()

    expect(spy).toHaveBeenCalledWith('a_specific_error')
  })
})
