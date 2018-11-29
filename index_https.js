'use strict'

const express = require('express')
const config = require('config')
const bodyParser = require('body-parser')
const validator = require('express-validator')
const path = require('path')
const fs = require('fs')
const https = require('https')
const privateKey = fs.readFileSync(path.resolve(__dirname, 'sslcert/server.key'))
const certificate = fs.readFileSync(path.resolve(__dirname, 'sslcert/server.crt'))

const credentials = { key: privateKey, cert: certificate }
// body parse
const app = express()

const server = https.Server(credentials, app)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(validator({}))

app.use('/build', express.static('build'))
app.use('/app/assets', express.static('app/assets'))

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
    console.info('Server start at https://%s:%s', host, port)
})

module.exports = app
