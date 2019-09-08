export function catchAndLog<T extends any[], U>(
  block: (...args: T) => U,
  logger = console.log
) {
  return async (...args: T) => {
    try {
      await block(...args)
    } catch (error) {
      logger(error.message)
      logger(error.stack.split('\n')[1])
    }
  }
}
