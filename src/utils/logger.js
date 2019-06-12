const { grey } = require('chalk')

const defaultLogLevels = {
  silly: 1,
  debug: 2,
  verbose: 3,
  info: 4,
  warn: 5,
  error: 6,
  none: 999
}

class Logger {
  constructor(level, logLevels = defaultLogLevels) {
    if (logLevels[level] === undefined) {
      throw new Error(`Invalid log level '${level}'`)
    }

    this.level = level
    this.availableLevels = logLevels

    for (let l of Object.keys(defaultLogLevels)) {
      this[l] = (...messages) => this.write(l, ...messages)
    }
  }

  write(levelName, ...messages) {
    if (this.skipLog(levelName)) return
    console.log(grey(levelName + ':'), ...messages)
  }

  skipLog(levelName) {
    let levelToLog = this.availableLevels[levelName]
    return (
      levelToLog === undefined || levelToLog < this.availableLevels[this.level]
    )
  }
}

const sharedLogger = new Logger(process.env.LOG_LEVEL || 'error')

module.exports = { defaultLogLevels, Logger, sharedLogger }
