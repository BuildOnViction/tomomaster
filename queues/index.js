'use strict'
const kue = require('kue')
const config = require('config')
const path = require('path')
const fs = require('fs')

const q = kue.createQueue({
    prefix: config.get('redis.prefix'),
    redis: {
        port: config.get('redis.port'),
        host: config.get('redis.host'),
        auth: config.get('redis.password')
    }
})

fs.readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function (file) {
        let consumer = require(path.join(__dirname, file))
        q.process(consumer.name, consumer.task)
    })

module.exports = q
