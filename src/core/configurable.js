class Configurable {
  constructor() {
    this.config = {}
  }

  create(config) {
    // Inject default values
    return config
  }

  configureFromCLI() {
    let config = this.create()

    // Configure using prompts

    return config
  }

  validateConfig(config) {
    // Validate config or throw errors
  }
}

module.exports = { Configurable }
