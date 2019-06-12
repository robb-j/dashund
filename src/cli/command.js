class Command {
  catchAndLog(block, logger = console.log) {
    return async (...args) => {
      try {
        await block(...args)
      } catch (error) {
        logger(error.message)
        logger(error.stack.split('\n')[1])
      }
    }
  }

  setup(cli, config, dashund, cwd) {}
}

module.exports = { Command }
