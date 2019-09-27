const { grey } = require('chalk')

export type LogType = keyof typeof allLogLevels

export const allLogLevels = {
  silly: 1,
  debug: 2,
  verbose: 3,
  info: 4,
  warn: 5,
  error: 6,
  none: 999
}

export class Logger<T extends LogType> {
  level: T

  constructor(levelName: T) {
    if (allLogLevels[levelName] === undefined) {
      throw new Error(`Invalid log levelName '${levelName}'`)
    }

    this.level = levelName
  }

  write(levelName: LogType, ...messages: any[]) {
    if (this.skipLog(levelName)) return
    console.log(grey(levelName + ':'), ...messages)
  }

  skipLog(levelName: LogType) {
    let levelToLog = allLogLevels[levelName]
    return levelToLog === undefined || levelToLog < allLogLevels[this.level]
  }

  silly(...messages: any[]) {
    this.write('silly', ...messages)
  }
  debug(...messages: any[]) {
    this.write('debug', ...messages)
  }
  verbose(...messages: any[]) {
    this.write('verbose', ...messages)
  }
  info(...messages: any[]) {
    this.write('info', ...messages)
  }
  warn(...messages: any[]) {
    this.write('warn', ...messages)
  }
  error(...messages: any[]) {
    this.write('error', ...messages)
  }
}

export const sharedLogger = new Logger(
  process.env.LOG_LEVEL || ('error' as any)
)
