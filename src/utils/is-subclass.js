// DEPRECATED

function isSubclassOf(TargetClass, ParentClass) {
  let current = TargetClass
  while (current) {
    if (current === ParentClass) return true
    current = Object.getPrototypeOf(current)
  }
  return false
}

module.exports = { isSubclassOf }
