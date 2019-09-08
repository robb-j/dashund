export function requiredArg(argName: string) {
  throw new Error(`${argName} is required`)
}
