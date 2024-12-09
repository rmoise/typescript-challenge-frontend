const Dotenv = require('dotenv-webpack')

module.exports = {
  plugins: [
    new Dotenv({
      systemvars: true,
      defaults: true,
      safe: true
    })
  ]
}

