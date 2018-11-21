'use strict'
const { createLogger, format, transports } = require('winston')
const config = require('config')

const logger = createLogger({
    format: format.combine(
        format.splat(),
        format.simple(),
        format.colorize()
    ),
    transports: [
        new transports.Console({
            level: config.get('logs.level'),
            handleExceptions: config.get('logs.handleExceptions'),
            json: false
        })
    ]
})

module.exports = logger
