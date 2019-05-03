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
// body parse
const app = express()

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

// error handler
app.use(require('./middlewares/error'))

app.get('*', function (req, res) {
    return res.sendFile(path.join(__dirname, 'index.html'))
})

// start server
server.listen(config.get('server.port'), config.get('server.host'), function () {
    const host = server.address().address
    const port = server.address().port
    console.info('Server start at http://%s:%s', host, port)
})

module.exports = app
