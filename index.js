'use strict'

const express = require('express')
const config = require('config')
const bodyParser = require('body-parser')
const validator = require('express-validator')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const morgan = require('morgan')
const logger = require('./helpers/logger')
const helmet = require('helmet')

// body parse
const app = express()

// helmet
app.use(helmet())
app.use(helmet.hidePoweredBy())

// cors
app.use(cors({
    origin: config.get('cors')
}))

app.use(morgan('short', { stream: logger.stream }))

const server = require('http').Server(app)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(validator({}))

app.use('/build', express.static('build'))
app.use('/app/assets', express.static('app/assets'))
const docs = yaml.safeLoad(fs.readFileSync('./docs/swagger.yml', 'utf8'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(docs))

// apis
app.use(require('./apis'))
app.use(require('./middlewares/sitemap'))

app.get('*', function (req, res) {
    let p
    if (process.env.NODE_ENV === 'development') {
        p = path.resolve(__dirname, 'index.html')
    } else {
        p = path.resolve(__dirname, './build', 'index.html')
    }
    return res.sendFile(p)
})

// error handler
app.use(require('./middlewares/error'))

// start server
server.listen(config.get('server.port'), config.get('server.host'), function () {
    const host = server.address().address
    const port = server.address().port
    console.info('Server start at http://%s:%s', host, port)
})

module.exports = app
