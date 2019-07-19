'use strict'

const environment = (process.env.NODE_ENV || 'development').trim()

if (environment === 'development') {
    module.exports = require('./webpack/webpack.config.dev')
} else {
    module.exports = require('./webpack/webpack.config.prod')
}
