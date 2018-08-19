'use strict'
const express = require('express')
const config = require('config')
const request = require('request')
const router = express.Router()

router.get('/', async function (req, res, next) {
    let db = req.query.db
    let query = req.query.q
    query = encodeURI(query).replace('=', '%3D').replace(';', '%3B')
    let epoch = req.query.epoch
    let apiKey = config.get('grafanaApiKey')
    let url = `${config.get('grafanaUrl')}/api/datasources/proxy/1/query?db=${db}&q=${query}&epoch=${epoch}`
    request({
        url: url,
        json: true,
        headers: { Authorization: `Bearer ${apiKey}` }
    }, (error, response, body) => {
        if (error) {
            return res.json(error)
        }
        return res.json(body)
    })
})

module.exports = router
