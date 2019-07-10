function requiredArg(argName) {
  throw new Error(`${argName} is required`)
}

module.exports = { requiredArg }
