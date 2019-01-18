const { createLogger, format, transports } = require('winston')
const { combine, printf } = format
const config = require('config')

const lFormat = printf(info => {
    return `${info.level.toUpperCase()}: ${info.message}`
})

const logger = createLogger({
    level: config.get('logs.level'),
    format: combine(
        format.splat(),
        lFormat
    ),
    transports: [new transports.Console()]
})

logger.stream = {
    write: (t) => {
        logger.info(t)
    }
}

module.exports = logger
